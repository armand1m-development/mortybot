import { assertEquals, assertThrows } from "@std/assert";
import { normalizeSearxngResults, searchSearxng } from "./searxng.ts";

Deno.test("normalizeSearxngResults accepts an empty result set", () => {
  assertEquals(normalizeSearxngResults({ results: [] }), []);
});

Deno.test("normalizeSearxngResults uses an infobox when engines return no results", () => {
  assertEquals(
    normalizeSearxngResults({
      results: [],
      infoboxes: [{
        infobox: "Morty Smith",
        id: "https://example.com/morty",
        content: "A dimension-hopping teenager.",
        engine: "wikipedia",
      }],
    }),
    [{
      url: "https://example.com/morty",
      title: "Morty Smith",
      content: "A dimension-hopping teenager.",
      engines: ["wikipedia"],
    }],
  );
});

Deno.test("normalizeSearxngResults keeps only useful fields and limits output", () => {
  const results = Array.from({ length: 10 }, (_, index) => ({
    url: `https://example.com/${index}`,
    title: `Result ${index}`,
    content: `Snippet ${index}`,
    engine: "example",
    ignored: "large provider-specific field",
  }));

  assertEquals(normalizeSearxngResults({ results }).length, 8);
  assertEquals(normalizeSearxngResults({ results })[0], {
    url: "https://example.com/0",
    title: "Result 0",
    content: "Snippet 0",
    engines: ["example"],
  });
});

Deno.test("normalizeSearxngResults rejects a malformed response", () => {
  assertThrows(
    () => normalizeSearxngResults({ answers: [] }),
    Error,
    "invalid JSON response",
  );
});

Deno.test("searchSearxng builds a JSON search request", async () => {
  let requestedUrl = "";
  let requestedMethod = "";

  const results = await searchSearxng({
    serverUrl: "http://search.internal/",
    method: "get",
    query: "Morty Bot",
    page: 2,
    fetch: (input, init) => {
      requestedUrl = String(input);
      requestedMethod = init?.method ?? "";
      return Promise.resolve(Response.json({
        results: [{
          url: "https://example.com",
          title: "Example",
          content: "Found it",
          engines: ["example"],
        }],
      }));
    },
  });

  assertEquals(requestedMethod, "GET");
  assertEquals(
    requestedUrl,
    "http://search.internal/search?q=Morty+Bot&format=json&pageno=2",
  );
  assertEquals(results[0].title, "Example");
});
