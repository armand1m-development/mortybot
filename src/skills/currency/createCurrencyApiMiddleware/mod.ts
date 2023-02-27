import { MiddlewareFn } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { withToken } from "../httpClients/convertCurrencyValue.ts";

export const createCurrencyApiMiddleware = () => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    ctx.currencyApi = {
      convertCurrencyValue: withToken(ctx.configuration.exchangeApiToken),
    };
    return next();
  };

  return middleware;
};
