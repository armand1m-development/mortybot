import { assertEquals, assertThrows } from "@std/assert";
import {
  DEFAULT_API_PORT,
  parseApiPort,
  parseAssistantEndpoint,
  parseAssistantThinking,
  parseBoolean,
  parsePositiveInteger,
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

const endpointVariables = {
  openAiBaseUrl: "http://100.127.91.6:30000/v1",
  openAiModel: "qwen3.8-27b",
  openAiApiKey: "sk-1234",
};

Deno.test("assistant endpoint variables pass through when configured", () => {
  assertEquals(
    parseAssistantEndpoint("production", [-1001651043611], endpointVariables),
    endpointVariables,
  );
  assertEquals(
    parseAssistantEndpoint("development", [], endpointVariables),
    endpointVariables,
  );
});

Deno.test("assistant endpoint variables are required when it can run", () => {
  for (
    const name of ["openAiBaseUrl", "openAiModel", "openAiApiKey"] as const
  ) {
    const missing = { ...endpointVariables, [name]: undefined };
    const envVar = {
      openAiBaseUrl: "OPENAI_BASE_URL",
      openAiModel: "OPENAI_MODEL",
      openAiApiKey: "OPENAI_API_KEY",
    }[name];

    const cases: Array<["development" | "production", number[]]> = [
      ["development", []],
      ["production", [123]],
    ];
    for (const [environment, chatIds] of cases) {
      assertThrows(
        () => parseAssistantEndpoint(environment, chatIds, missing),
        TypeError,
        `${envVar} is required when the assistant is enabled`,
      );
    }
  }
});

Deno.test("blank endpoint variables count as missing", () => {
  assertThrows(
    () =>
      parseAssistantEndpoint("production", [123], {
        ...endpointVariables,
        openAiBaseUrl: "   ",
      }),
    TypeError,
    "OPENAI_BASE_URL is required when the assistant is enabled",
  );
});

Deno.test("endpoint variables may be absent when the assistant is off", () => {
  assertEquals(
    parseAssistantEndpoint("production", [], {
      openAiBaseUrl: undefined,
      openAiModel: undefined,
      openAiApiKey: undefined,
    }),
    { openAiBaseUrl: "", openAiModel: "", openAiApiKey: "" },
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
