import { assertEquals, assertThrows } from "@std/assert";
import {
  DEFAULT_API_PORT,
  parseApiPort,
  parseAssistantThinking,
  parseBoolean,
  parsePositiveInteger,
  parseTailnetKeepaliveUrls,
  parseUnitInterval,
} from "./environment.ts";

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

Deno.test("positive integer settings use defaults and accept overrides", () => {
  assertEquals(
    parsePositiveInteger("TEST_TIMEOUT", undefined, 120_000),
    120_000,
  );
  assertEquals(parsePositiveInteger("TEST_TIMEOUT", "", 120_000), 120_000);
  assertEquals(
    parsePositiveInteger("TEST_TIMEOUT", "900000", 120_000),
    900_000,
  );
});

Deno.test("positive integer settings reject invalid values", () => {
  for (const value of ["0", "-1", "1.5", "nope"]) {
    assertThrows(
      () => parsePositiveInteger("TEST_TIMEOUT", value, 120_000),
      TypeError,
      "TEST_TIMEOUT must be a positive integer",
    );
  }
});

Deno.test("boolean settings use defaults and accept case-insensitive values", () => {
  assertEquals(parseBoolean("TEST_FLAG", undefined, false), false);
  assertEquals(parseBoolean("TEST_FLAG", "", true), true);
  assertEquals(parseBoolean("TEST_FLAG", " TRUE ", false), true);
  assertEquals(parseBoolean("TEST_FLAG", "false", true), false);
});

Deno.test("boolean settings reject ambiguous values", () => {
  for (const value of ["1", "yes", "enabled"]) {
    assertThrows(
      () => parseBoolean("TEST_FLAG", value, false),
      TypeError,
      'TEST_FLAG must be either "true" or "false"',
    );
  }
});

Deno.test("assistant thinking mode defaults to auto and accepts each level", () => {
  assertEquals(parseAssistantThinking(undefined), "auto");
  assertEquals(parseAssistantThinking(""), "auto");
  assertEquals(parseAssistantThinking(" OFF "), "off");
  assertEquals(parseAssistantThinking("on"), "on");
});

Deno.test("assistant thinking mode rejects unknown levels", () => {
  assertThrows(
    () => parseAssistantThinking("maybe"),
    TypeError,
    "ASSISTANT_THINKING",
  );
});

Deno.test("temperature settings use defaults and accept fractional overrides", () => {
  assertEquals(parseUnitInterval("TEST_TEMPERATURE", undefined, 0.7), 0.7);
  assertEquals(parseUnitInterval("TEST_TEMPERATURE", "", 0.7), 0.7);
  assertEquals(parseUnitInterval("TEST_TEMPERATURE", "0", 0.7), 0);
  assertEquals(parseUnitInterval("TEST_TEMPERATURE", "1.25", 0.7), 1.25);
});

Deno.test("temperature settings reject values outside the sampling range", () => {
  for (const value of ["-0.1", "2.5", "hot"]) {
    assertThrows(
      () => parseUnitInterval("TEST_TEMPERATURE", value, 0.7),
      TypeError,
      "TEST_TEMPERATURE",
    );
  }
});

Deno.test("tailnet keepalive URLs default to none and accept comma-separated lists", () => {
  assertEquals(parseTailnetKeepaliveUrls(undefined), []);
  assertEquals(parseTailnetKeepaliveUrls(""), []);
  assertEquals(parseTailnetKeepaliveUrls("   "), []);
  assertEquals(
    parseTailnetKeepaliveUrls(
      "http://host-a:13000/healthz, http://host-b/ ,,",
    ),
    ["http://host-a:13000/healthz", "http://host-b/"],
  );
});
