import { assertEquals, assertLessOrEqual } from "@std/assert";
import { chunkMessage } from "./chunkMessage.ts";

const tagBalance = (html: string): number => {
  let depth = 0;
  for (
    const match of html.matchAll(/<(\/?)(pre|code|blockquote)(\s[^>]*)?>/g)
  ) {
    depth += match[1] === "/" ? -1 : 1;
  }
  return depth;
};

Deno.test("keeps short messages in a single chunk", () => {
  assertEquals(chunkMessage("<b>hello</b>"), ["<b>hello</b>"]);
});

Deno.test("breaks on newlines when possible", () => {
  assertEquals(chunkMessage("aaaa\nbbbb\ncccc", 10), ["aaaa\nbbbb", "cccc"]);
});

Deno.test("closes and reopens code blocks across chunks", () => {
  const html = '<pre><code class="language-ts">line one\nline two\nline three' +
    "</code></pre>";
  const chunks = chunkMessage(html, 60);

  assertEquals(chunks.length > 1, true);
  for (const chunk of chunks) {
    assertLessOrEqual(chunk.length, 60);
    assertEquals(tagBalance(chunk), 0);
    assertEquals(chunk.startsWith("<pre><code"), true);
    assertEquals(chunk.endsWith("</code></pre>"), true);
  }
  assertEquals(
    chunks.map((chunk) => chunk.replace(/<[^>]*>/g, "")).join("\n"),
    "line one\nline two\nline three",
  );
});

Deno.test("reopens blockquotes across chunks", () => {
  const chunks = chunkMessage("<blockquote>one\ntwo\nthree</blockquote>", 30);

  assertEquals(chunks.length > 1, true);
  for (const chunk of chunks) {
    assertEquals(tagBalance(chunk), 0);
  }
});

Deno.test("never splits inside a tag or an entity", () => {
  const line = `${"x".repeat(30)}<a href="https://example.com/page">label</a>` +
    `${"y".repeat(30)}&amp;${"z".repeat(30)}`;
  const chunks = chunkMessage(line, 40);

  for (const chunk of chunks) {
    assertLessOrEqual(chunk.length, 40);
    assertEquals(/<[^>]*$/.test(chunk), false);
    assertEquals(/&[#\w]*$/.test(chunk), false);
  }
  assertEquals(chunks.join(""), line);
});

Deno.test("splits a single oversized line into bounded chunks", () => {
  const chunks = chunkMessage("word ".repeat(2000).trim(), 100);

  for (const chunk of chunks) {
    assertLessOrEqual(chunk.length, 100);
  }
  assertEquals(
    chunks.join("").replace(/\s+/g, " ").trim(),
    "word ".repeat(2000).trim(),
  );
});
