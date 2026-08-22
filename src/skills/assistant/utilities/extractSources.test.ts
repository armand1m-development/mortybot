import { assertEquals } from "@std/assert";
import { extractSources } from "./extractSources.ts";

Deno.test("extractSources preserves titles from embedded JSON tool output", () => {
  const input = `Search results:\n${
    JSON.stringify([
      { url: "https://example.com/one", title: "First result" },
      { url: "https://example.com/two", title: "Second result" },
    ])
  }`;

  assertEquals(extractSources(input), [
    { url: "https://example.com/one", title: "First result" },
    { url: "https://example.com/two", title: "Second result" },
  ]);
});

Deno.test("extractSources falls back to URLs in unstructured text", () => {
  assertEquals(
    extractSources(
      "See https://example.com/one, then https://example.com/two.",
    ),
    [
      { url: "https://example.com/one" },
      { url: "https://example.com/two" },
    ],
  );
});

Deno.test("extractSources reads MCP structured search results", () => {
  assertEquals(
    extractSources({
      results: [{
        url: "https://example.com/structured",
        title: "Structured result",
      }],
    }),
    [{
      url: "https://example.com/structured",
      title: "Structured result",
    }],
  );
});
