import { assertEquals, assertFalse } from "@std/assert";
import { getSafeErrorSummary, sanitizeLogText } from "./sanitizeLogText.ts";

Deno.test("log sanitizer escapes terminal control characters", () => {
  const sanitized = sanitizeLogText("before\u001b[31mred\u001b[0m\nafter");

  assertEquals(
    sanitized,
    "before\\u001b[31mred\\u001b[0m\\u000aafter",
  );
  assertFalse(sanitized.includes("\u001b"));
  assertFalse(sanitized.includes("\n"));
});

Deno.test("safe error summaries omit stacks and limit output", () => {
  const summary = getSafeErrorSummary(
    new Error(`bad\u001b[31m${"x".repeat(1_000)}`),
  );

  assertEquals(summary.length, 500);
  assertFalse(summary.includes("\u001b"));
  assertFalse(summary.includes("at file:"));
});
