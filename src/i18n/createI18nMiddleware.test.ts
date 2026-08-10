import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import { createI18nMiddleware } from "./createI18nMiddleware.ts";

Deno.test("i18n middleware defaults old sessions to English", async () => {
  const context = { session: {} } as BotContext;
  let nextCalled = false;

  await createI18nMiddleware()(context, () => {
    nextCalled = true;
    return Promise.resolve();
  });

  assertEquals(nextCalled, true);
  assertEquals(context.language, "en");
  assertEquals(context.t("filters.added"), "Filter added.");
});

Deno.test("i18n middleware uses the language persisted for the chat", async () => {
  const context = { session: { language: "pt" } } as BotContext;

  await createI18nMiddleware()(context, () => Promise.resolve());

  assertEquals(context.language, "pt");
  assertEquals(context.t("filters.added"), "Filtro adicionado.");
});
