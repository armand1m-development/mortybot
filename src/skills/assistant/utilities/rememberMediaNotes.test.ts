import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import { rememberMediaNotes } from "./rememberMediaNotes.ts";
import { createInitialAssistantState } from "../sessionData/getInitialAssistantSessionData.ts";
import type { OpenAiMessage } from "../httpClients/types.ts";

const contextWith = (messages: OpenAiMessage[]): BotContext =>
  ({
    session: {
      assistant: { ...createInitialAssistantState(), messages },
    },
  }) as unknown as BotContext;

Deno.test("a note joins the assistant's last turn rather than becoming one", () => {
  const ctx = contextWith([
    { role: "user", content: "show me the bridge" },
    { role: "assistant", content: "Here you go." },
  ]);

  rememberMediaNotes(ctx, ["[2 photos: heavy traffic]"]);

  const messages = ctx.session.assistant!.messages;
  assertEquals(messages.length, 2);
  assertEquals(
    messages[1].content,
    "Here you go.\n\n[2 photos: heavy traffic]",
  );
});

Deno.test("a note after a user turn is remembered on its own", () => {
  const ctx = contextWith([{ role: "user", content: "show me the bridge" }]);

  rememberMediaNotes(ctx, ["[2 photos: heavy traffic]"]);

  const messages = ctx.session.assistant!.messages;
  assertEquals(messages.length, 2);
  assertEquals(messages[1].role, "assistant");
  assertEquals(messages[1].content, "[2 photos: heavy traffic]");
});

Deno.test("nothing to remember leaves the history untouched", () => {
  const ctx = contextWith([{ role: "user", content: "hi" }]);

  rememberMediaNotes(ctx, []);

  assertEquals(ctx.session.assistant!.messages.length, 1);
});
