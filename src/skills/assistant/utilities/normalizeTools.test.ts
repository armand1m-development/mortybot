import { assertEquals } from "@std/assert";
import { normalizeJsonSchema, normalizeOpenAiTools } from "./normalizeTools.ts";
import type { OpenAiTool } from "../httpClients/types.ts";

const tool = (name: string, parameters: Record<string, unknown> = {}) => ({
  type: "function" as const,
  function: { name, parameters },
});

Deno.test("tool normalization sorts tools by name", () => {
  const tools: OpenAiTool[] = [
    tool("search_web"),
    tool("bot_weather"),
    tool("bot_currency"),
  ];

  assertEquals(
    normalizeOpenAiTools(tools).map((entry) => entry.function.name),
    ["bot_currency", "bot_weather", "search_web"],
  );
});

Deno.test("tool normalization produces identical JSON for reordered input", () => {
  const first: OpenAiTool[] = [tool("b"), tool("a")];
  const second: OpenAiTool[] = [tool("a"), tool("b")];

  assertEquals(
    JSON.stringify(normalizeOpenAiTools(first)),
    JSON.stringify(normalizeOpenAiTools(second)),
  );
});

Deno.test("tool normalization sorts schema keys without reordering arrays", () => {
  assertEquals(
    JSON.stringify(normalizeJsonSchema({
      required: ["query", "page"],
      type: "object",
      properties: {
        query: { type: "string" },
        page: { type: "number", default: 1 },
      },
      additionalProperties: false,
    })),
    JSON.stringify({
      additionalProperties: false,
      properties: {
        page: { default: 1, type: "number" },
        query: { type: "string" },
      },
      required: ["query", "page"],
      type: "object",
    }),
  );
});

Deno.test("tool normalization drops annotation-only keywords", () => {
  assertEquals(
    normalizeJsonSchema({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "Search",
      examples: [{ query: "morty" }],
      readOnly: true,
      type: "object",
      properties: { query: { type: "string", description: "Keywords." } },
    }),
    {
      properties: { query: { description: "Keywords.", type: "string" } },
      type: "object",
    },
  );
});

Deno.test("tool normalization keeps descriptions and omits empty ones", () => {
  const [described, bare] = normalizeOpenAiTools([
    {
      type: "function",
      function: { name: "a", description: "Does a.", parameters: {} },
    },
    tool("b"),
  ]);

  assertEquals(described.function.description, "Does a.");
  assertEquals("description" in bare.function, false);
});
