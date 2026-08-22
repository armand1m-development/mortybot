import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import type { TranslationKey } from "/src/i18n/mod.ts";
import {
  type AssistantResponseLanguage,
  defaultAssistantResponseLanguage,
  parseAssistantResponseLanguage,
} from "../utilities/assistantLanguage.ts";
import { createInitialAssistantState } from "../sessionData/getInitialAssistantSessionData.ts";

const languageNameKeys = {
  auto: "assistant.language.name.auto",
  en: "language.name.en",
  pt: "language.name.pt",
} as const satisfies Record<AssistantResponseLanguage, TranslationKey>;

export const cmdAssistantLanguage: CommandMiddleware<BotContext> = (ctx) => {
  const current = ctx.session.assistant?.responseLanguage ??
    defaultAssistantResponseLanguage;

  if (!ctx.match.trim()) {
    return ctx.reply(ctx.t("assistant.language.current", {
      language: ctx.t(languageNameKeys[current]),
    }));
  }

  const language = parseAssistantResponseLanguage(ctx.match);
  if (!language) {
    return ctx.reply(ctx.t("assistant.language.unsupported"));
  }

  ctx.session.assistant ??= createInitialAssistantState();
  ctx.session.assistant.responseLanguage = language;

  return ctx.reply(ctx.t("assistant.language.changed", {
    language: ctx.t(languageNameKeys[language]),
  }));
};
