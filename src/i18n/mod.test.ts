import { assertEquals } from "@std/assert";
import { createTranslator, parseLanguage } from "./mod.ts";

Deno.test("translates typed interpolated messages", () => {
  const translate = createTranslator("pt");

  assertEquals(
    translate("language.changed", { language: "Português" }),
    "Idioma alterado para Português.",
  );
});

Deno.test("supports locale-aware ICU plurals and translated-fragment composition", () => {
  const en = createTranslator("en");
  const pt = createTranslator("pt");

  const entry = pt("filters.ownerCount.entry", {
    owner: "Morty",
    count: 2,
  });

  assertEquals(entry, "- Morty: 2 filtros");
  assertEquals(
    pt("filters.ownerCount.heading", { entries: entry }),
    "*Filtros por dono*:\n\n- Morty: 2 filtros",
  );
  assertEquals(
    en("filters.ownerCount.entry", { owner: "Morty", count: 1 }),
    "- Morty: 1 filter",
  );
});

Deno.test("accepts PT and EN language variants", () => {
  assertEquals(parseLanguage("PT"), "pt");
  assertEquals(parseLanguage("pt-BR"), "pt");
  assertEquals(parseLanguage("EN"), "en");
  assertEquals(parseLanguage("es"), undefined);
});

const assertTranslationTypes = () => {
  const translate = createTranslator("en");
  // @ts-expect-error: this key does not exist in the YAML catalog.
  translate("missing.translation");
  // @ts-expect-error: values required by this message cannot be omitted.
  translate("language.changed");
  // @ts-expect-error: count is generated as a number from the ICU plural.
  translate("filters.ownerCount.entry", { owner: "Morty", count: "two" });
};

void assertTranslationTypes;
