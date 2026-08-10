import { assertEquals, assertThrows } from "@std/assert";
import { DEFAULT_API_PORT, parseApiPort } from "./environment.ts";

Deno.test("API port defaults to 3000 when it is not configured", () => {
  assertEquals(parseApiPort(undefined), DEFAULT_API_PORT);
  assertEquals(parseApiPort(""), DEFAULT_API_PORT);
  assertEquals(parseApiPort("   "), DEFAULT_API_PORT);
});

Deno.test("API port accepts valid integer ports", () => {
  assertEquals(parseApiPort("1"), 1);
  assertEquals(parseApiPort("3000"), 3_000);
  assertEquals(parseApiPort("65535"), 65_535);
});

Deno.test("API port rejects invalid values with a configuration error", () => {
  for (const value of ["0", "65536", "3000.5", "3000abc", "NaN"]) {
    assertThrows(
      () => parseApiPort(value),
      TypeError,
      "API_PORT must be an integer between 1 and 65535",
    );
  }
});
