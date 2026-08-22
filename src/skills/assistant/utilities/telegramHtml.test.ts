import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  markdownToTelegramHtml,
  telegramHtmlToPlainText,
} from "./telegramHtml.ts";

Deno.test("converts emphasis markers to Telegram tags", () => {
  assertEquals(
    markdownToTelegramHtml("**bold** and *italic* and ~~gone~~ and __also__"),
    "<b>bold</b> and <i>italic</i> and <s>gone</s> and <b>also</b>",
  );
  assertEquals(
    markdownToTelegramHtml("***everything*** at once"),
    "<b><i>everything</i></b> at once",
  );
});

Deno.test("escapes HTML so model output cannot inject tags", () => {
  assertEquals(
    markdownToTelegramHtml("use <b>tags</b> & <script>alert(1)</script>"),
    "use &lt;b&gt;tags&lt;/b&gt; &amp; &lt;script&gt;alert(1)&lt;/script&gt;",
  );
});

Deno.test("leaves snake_case and math asterisks alone", () => {
  assertEquals(
    markdownToTelegramHtml("call some_function_name with 2 * 3 * 4"),
    "call some_function_name with 2 * 3 * 4",
  );
});

Deno.test("renders headings as bold single lines", () => {
  assertEquals(
    markdownToTelegramHtml("# Title\n\nbody"),
    "<b>Title</b>\n\nbody",
  );
  assertEquals(
    markdownToTelegramHtml("### Sub *title* ###"),
    "<b>Sub <i>title</i></b>",
  );
});

Deno.test("turns lists into bulleted lines Telegram can show", () => {
  assertEquals(
    markdownToTelegramHtml("- one\n- two\n  - nested\n\n1. first\n2. second"),
    "• one\n• two\n  ◦ nested\n\n1. first\n2. second",
  );
});

Deno.test("keeps code blocks intact and escaped", () => {
  assertEquals(
    markdownToTelegramHtml("```ts\nconst a = 1 < 2;\n```"),
    '<pre><code class="language-ts">const a = 1 &lt; 2;</code></pre>',
  );
  assertEquals(
    markdownToTelegramHtml("```\nplain\n```"),
    "<pre>plain</pre>",
  );
});

Deno.test("does not format inside code spans", () => {
  assertEquals(
    markdownToTelegramHtml("run `npm i -D **pkg**` now"),
    "run <code>npm i -D **pkg**</code> now",
  );
});

Deno.test("converts links and ignores emphasis inside the URL", () => {
  assertEquals(
    markdownToTelegramHtml("[the docs](https://example.com/a_b_c)"),
    '<a href="https://example.com/a_b_c">the docs</a>',
  );
});

Deno.test("leaves non-http link targets as plain text", () => {
  assertEquals(
    markdownToTelegramHtml("[click](javascript:alert(1))"),
    "[click](javascript:alert(1))",
  );
});

Deno.test("renders blockquotes without nesting other blocks", () => {
  assertEquals(
    markdownToTelegramHtml("> quoted **line**\n> second"),
    "<blockquote>quoted <b>line</b>\nsecond</blockquote>",
  );
});

Deno.test("flattens tables into readable rows", () => {
  assertEquals(
    markdownToTelegramHtml("| Name | Age |\n| --- | --- |\n| Ana | 30 |"),
    "<b>Name | Age</b>\nAna | 30",
  );
});

Deno.test("telegramHtmlToPlainText restores the original characters", () => {
  assertEquals(
    telegramHtmlToPlainText(
      '<b>a &amp; b</b> <a href="https://x.dev">link</a> &lt;tag&gt;',
    ),
    "a & b link <tag>",
  );
});

Deno.test("horizontal rules do not leak markdown markers", () => {
  assertStringIncludes(markdownToTelegramHtml("a\n\n---\n\nb"), "———");
});
