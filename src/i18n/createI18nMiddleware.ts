import type { MiddlewareFn } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { createTranslator, defaultLanguage, isLanguage } from "./mod.ts";

export const createI18nMiddleware = (): MiddlewareFn<BotContext> => {
  return async (ctx, next) => {
    const language = isLanguage(ctx.session.language)
      ? ctx.session.language
      : defaultLanguage;

    ctx.language = language;
    ctx.t = createTranslator(language);

    await next();
  };
};
