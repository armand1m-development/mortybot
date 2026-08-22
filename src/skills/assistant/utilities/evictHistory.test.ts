import { assertEquals } from "@std/assert";
import {
  estimateTokens,
  evictHistory,
  HISTORY_MAX_TOKENS,
} from "./evictHistory.ts";
import type { OpenAiMessage } from "../httpClients/types.ts";

/** Builds `count` alternating messages of roughly `tokens` tokens each. */
const conversation = (count: number, tokens = 100): OpenAiMessage[] =>
  Array.from({ length: count }, (_unused, index) => ({
    role: index % 2 === 0 ? "user" as const : "assistant" as const,
    content: `${index}`.padEnd(tokens * 4, "x"),
  }));

Deno.test("history estimation counts about four characters per token", () => {
  assertEquals(
    estimateTokens([{ role: "user", content: "x".repeat(400) }]),
    100,
  );
});

Deno.test("history under budget is returned untouched", () => {
  const messages = conversation(10);

  assertEquals(evictHistory(messages, HISTORY_MAX_TOKENS), messages);
});

Deno.test("history over budget drops down to half the budget in one go", () => {
  const messages = conversation(40, 100);

  const evicted = evictHistory(messages, 1_000);

  assertEquals(estimateTokens(evicted) <= 500, true);
  // The newest messages survive.
  assertEquals(evicted.at(-1), messages.at(-1));
});

Deno.test("eviction leaves room to grow again before the next one", () => {
  const messages = conversation(40, 100);

  const evicted = evictHistory(messages, 1_000);
  // Adding another exchange of the same size must not trigger a second
  // eviction, otherwise the prefix would shift on every turn again.
  const grown = [...evicted, ...conversation(2, 100)];

  assertEquals(evictHistory(grown, 1_000), grown);
});

Deno.test("eviction cuts on a user message", () => {
  const messages = conversation(40, 100);

  assertEquals(evictHistory(messages, 1_000)[0].role, "user");
});

Deno.test("eviction always keeps the newest exchange", () => {
  const messages = conversation(4, 10_000);

  const evicted = evictHistory(messages, 1_000);

  assertEquals(evicted.length, 2);
  assertEquals(evicted, messages.slice(-2));
});

Deno.test("a conversation shorter than one exchange is never trimmed", () => {
  const messages = conversation(2, 10_000);

  assertEquals(evictHistory(messages, 1_000), messages);
});
