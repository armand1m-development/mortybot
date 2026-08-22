import { assertEquals } from "@std/assert";
import { formatToolTrace } from "./formatToolTrace.ts";
import { markdownToTelegramHtml } from "./telegramHtml.ts";

Deno.test("tool trace reports when no tool was used", () => {
  assertEquals(formatToolTrace([]), "*debug: no tools called*");
});

Deno.test("tool trace lists every call in order with its duration", () => {
  assertEquals(
    formatToolTrace([
      { name: "search_web", durationMs: 1234 },
      { name: "bot_weather", durationMs: 12 },
    ]),
    "*debug: 2 tool calls: search_web 1234ms, bot_weather 12ms*",
  );
});

Deno.test("tool trace marks failed calls", () => {
  assertEquals(
    formatToolTrace([{ name: "search_web", failed: true, durationMs: 7 }]),
    "*debug: 1 tool call: search_web (failed) 7ms*",
  );
});

Deno.test("tool trace survives the Telegram markdown conversion", () => {
  assertEquals(
    markdownToTelegramHtml(
      formatToolTrace([{ name: "bot_get_weather", durationMs: 5 }]),
    ),
    "<i>debug: 1 tool call: bot_get_weather 5ms</i>",
  );
});
