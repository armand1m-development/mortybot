import { assertEquals } from "@std/assert";
import { extractCodeFiles } from "./extractCodeFiles.ts";

Deno.test("extractCodeFiles creates named files and keeps explanatory prose", () => {
  const result = extractCodeFiles([
    "Here is the small web app.",
    "",
    "File: `index.html`",
    "```html",
    "<main>Hello</main>",
    "```",
    "",
    "**File:** `app.js`",
    "```javascript",
    'document.querySelector("main");',
    "```",
    "",
    "Open index.html to run it.",
  ].join("\n"));

  assertEquals(result, {
    text: "Here is the small web app.\n\nOpen index.html to run it.",
    files: [
      { filename: "index.html", content: "<main>Hello</main>\n" },
      {
        filename: "app.js",
        content: 'document.querySelector("main");\n',
      },
    ],
  });
});

Deno.test("extractCodeFiles infers safe unique filenames", () => {
  const result = extractCodeFiles([
    "```typescript",
    "export const first = 1;",
    "```",
    "```ts",
    "export const second = 2;",
    "```",
    "```text filename=docs/notes.txt",
    "remember this",
    "```",
  ].join("\n"));

  assertEquals(result, {
    text: "",
    files: [
      { filename: "code.ts", content: "export const first = 1;\n" },
      { filename: "code-2.ts", content: "export const second = 2;\n" },
      { filename: "docs__notes.txt", content: "remember this\n" },
    ],
  });
});

Deno.test("extractCodeFiles supports filename headings", () => {
  const result = extractCodeFiles([
    "### server.py",
    "```python",
    'print("ready")',
    "```",
  ].join("\r\n"));

  assertEquals(result, {
    text: "",
    files: [{ filename: "server.py", content: 'print("ready")\r\n' }],
  });
});

Deno.test("extractCodeFiles leaves responses without fenced code unchanged", () => {
  const text = "Use the `Array.map` method for this.";
  assertEquals(extractCodeFiles(text), { text, files: [] });
});
