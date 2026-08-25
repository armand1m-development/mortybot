import { assertEquals } from "@std/assert";
import {
  ASSISTANT_CLOCK_TIME_ZONE,
  callBuiltinAssistantTool,
  formatClockReading,
  getBuiltinAssistantTools,
} from "./builtinTools.ts";

Deno.test("clock reading reports Amsterdam local time, UTC, and epoch", () => {
  // 2026-08-22T13:05:45.250Z is a Saturday, 15:05:45 in Amsterdam (CEST).
  const reading = formatClockReading(new Date("2026-08-22T13:05:45.250Z"));

  assertEquals(
    reading,
    [
      `Amsterdam (${ASSISTANT_CLOCK_TIME_ZONE}): Saturday 2026-08-22 15:05:45`,
      "UTC: 2026-08-22T13:05:45Z",
      "Epoch: 1787403945.250s",
    ].join("\n"),
  );
});

Deno.test("clock reading covers the Amsterdam winter offset", () => {
  // 2026-01-02T23:00:00.000Z is Saturday 2026-01-03 midnight in Amsterdam
  // (CET, UTC+1), including the h23 edge where hour 24 must never appear.
  const reading = formatClockReading(new Date("2026-01-02T23:00:00.000Z"));

  assertEquals(
    reading,
    [
      `Amsterdam (${ASSISTANT_CLOCK_TIME_ZONE}): Saturday 2026-01-03 00:00:00`,
      "UTC: 2026-01-02T23:00:00Z",
      "Epoch: 1767394800.000s",
    ].join("\n"),
  );
});

Deno.test("the built-in tool set exposes only defined tools", () => {
  const tools = getBuiltinAssistantTools();

  assertEquals(tools.map((tool) => tool.function.name), ["get_time"]);
  assertEquals(
    getBuiltinAssistantTools() === tools,
    true,
    "the tool array must keep its identity between calls",
  );
});

Deno.test("built-in dispatch runs the clock and falls through for others", () => {
  const result = callBuiltinAssistantTool(
    "get_time",
    () => new Date("2026-08-22T13:05:45.250Z"),
  );

  assertEquals(result?.sources, []);
  assertEquals(
    result?.text.includes("Saturday 2026-08-22 15:05:45"),
    true,
  );
  assertEquals(
    callBuiltinAssistantTool("search_web", () => new Date()),
    undefined,
  );
});
