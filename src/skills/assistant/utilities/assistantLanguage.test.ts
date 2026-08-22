import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  buildAssistantLanguageDirective,
  parseAssistantResponseLanguage,
} from "./assistantLanguage.ts";

Deno.test("parseAssistantResponseLanguage accepts supported values case-insensitively", () => {
  assertEquals(parseAssistantResponseLanguage(" AUTO "), "auto");
  assertEquals(parseAssistantResponseLanguage("en"), "en");
  assertEquals(parseAssistantResponseLanguage("Pt"), "pt");
  assertEquals(parseAssistantResponseLanguage("es"), undefined);
});

Deno.test("automatic assistant language follows the configured chat language", () => {
  assertEquals(
    buildAssistantLanguageDirective("auto", "en"),
    "Respond in English.",
  );
  assertEquals(
    buildAssistantLanguageDirective("auto", "pt"),
    "Respond in Brazilian Portuguese.",
  );
});

Deno.test("forced assistant language overrides the language used by the user", () => {
  const english = buildAssistantLanguageDirective("en", "pt");
  const portuguese = buildAssistantLanguageDirective("pt", "en");

  assertStringIncludes(english, "MUST respond in English");
  assertStringIncludes(english, "regardless of the language used by the user");
  assertStringIncludes(portuguese, "MUST respond in Brazilian Portuguese");
});
