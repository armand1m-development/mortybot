import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import {
  createTranslator,
  type Language,
  parseLanguage,
  type TranslationKey,
} from "/src/i18n/mod.ts";

const languageNameKeys = {
  en: "language.name.en",
  pt: "language.name.pt",
} as const satisfies Record<Language, TranslationKey>;

export const cmdLanguage: CommandMiddleware<BotContext> = (ctx) => {
  if (!ctx.match.trim()) {
    return ctx.reply(ctx.t("language.current", {
      language: ctx.t(languageNameKeys[ctx.language]),
    }));
  }

  const language = parseLanguage(ctx.match);
  if (!language) {
    return ctx.reply(ctx.t("language.unsupported"));
  }

  ctx.session.language = language;
  const translate = createTranslator(language);

  return ctx.reply(translate("language.changed", {
    language: translate(languageNameKeys[language]),
  }));
};
