import { assertEquals } from "@std/assert";
import { CacheDriftTracker } from "./cacheDrift.ts";
import type { OpenAiMessage, OpenAiTool } from "../httpClients/types.ts";

const tools: OpenAiTool[] = [{
  type: "function",
  function: { name: "search_web", parameters: { type: "object" } },
}];

const turn = (count: number): OpenAiMessage[] =>
  Array.from({ length: count }, (_unused, index) => ({
    role: index % 2 === 0 ? "user" as const : "assistant" as const,
    content: `message ${index}`,
  }));

Deno.test("cache drift reports a cold start for a chat's first turn", () => {
  const tracker = new CacheDriftTracker();

  assertEquals(
    tracker.record(1, { system: "prompt", tools, history: [] }),
    "cold_start",
  );
});

Deno.test("cache drift stays quiet while history only grows", () => {
  const tracker = new CacheDriftTracker();

  tracker.record(1, { system: "prompt", tools, history: turn(2) });

  assertEquals(
    tracker.record(1, { system: "prompt", tools, history: turn(4) }),
    "unknown",
  );
});

Deno.test("cache drift blames the system prompt when it changes", () => {
  const tracker = new CacheDriftTracker();

  tracker.record(1, { system: "prompt", tools, history: turn(2) });

  assertEquals(
    tracker.record(1, { system: "different prompt", tools, history: turn(2) }),
    "system_change",
  );
});

Deno.test("cache drift blames the tools when they are reordered", () => {
  const tracker = new CacheDriftTracker();
  const reordered: OpenAiTool[] = [
    ...tools,
    {
      type: "function",
      function: { name: "bot_weather", parameters: { type: "object" } },
    },
  ];

  tracker.record(1, { system: "prompt", tools, history: turn(2) });

  assertEquals(
    tracker.record(1, { system: "prompt", tools: reordered, history: turn(2) }),
    "tools_change",
  );
});

Deno.test("cache drift detects history that no longer extends the last turn", () => {
  const tracker = new CacheDriftTracker();

  tracker.record(1, { system: "prompt", tools, history: turn(6) });

  assertEquals(
    tracker.record(1, {
      system: "prompt",
      tools,
      // The oldest messages were dropped, so the previous turn is no longer a
      // prefix of this one and every history token must be prefilled again.
      history: turn(6).slice(2),
    }),
    "history_evicted",
  );
});

Deno.test("cache drift tracks chats independently", () => {
  const tracker = new CacheDriftTracker();

  tracker.record(1, { system: "prompt", tools, history: turn(2) });

  assertEquals(
    tracker.record(2, { system: "prompt", tools, history: turn(2) }),
    "cold_start",
  );
});

Deno.test("cache drift forgets the least recently seen chat past its limit", () => {
  const tracker = new CacheDriftTracker(2);

  tracker.record(1, { system: "prompt", tools, history: turn(2) });
  tracker.record(2, { system: "prompt", tools, history: turn(2) });
  tracker.record(3, { system: "prompt", tools, history: turn(2) });

  assertEquals(
    tracker.record(1, { system: "prompt", tools, history: turn(2) }),
    "cold_start",
  );
  assertEquals(
    tracker.record(3, { system: "prompt", tools, history: turn(2) }),
    "unknown",
  );
});
