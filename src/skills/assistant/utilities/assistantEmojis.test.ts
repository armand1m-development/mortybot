import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  buildAssistantEmojiDirective,
  parseAssistantEmojisEnabled,
  removeEmojis,
} from "./assistantEmojis.ts";

Deno.test("parseAssistantEmojisEnabled accepts ON and OFF case-insensitively", () => {
  assertEquals(parseAssistantEmojisEnabled(" ON "), true);
  assertEquals(parseAssistantEmojisEnabled("off"), false);
  assertEquals(parseAssistantEmojisEnabled("sometimes"), undefined);
});

Deno.test("disabled emoji mode adds an explicit model instruction", () => {
  assertEquals(buildAssistantEmojiDirective(true), "");
  assertStringIncludes(
    buildAssistantEmojiDirective(false),
    "Do not use emojis anywhere",
  );
});

Deno.test("removeEmojis strips common emoji sequences and preserves normal text", () => {
  assertEquals(
    removeEmojis("Hello 😀 ❤️ 👍🏽 family 👨‍👩‍👧‍👦 flag 🇧🇷 key 1️⃣. 2 + 2 = 4."),
    "Hello    family  flag  key . 2 + 2 = 4.",
  );
  assertEquals(
    removeEmojis("Português, 日本語, © 2026"),
    "Português, 日本語,  2026",
  );
});
