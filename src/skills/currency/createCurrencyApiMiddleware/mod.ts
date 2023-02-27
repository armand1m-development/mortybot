import { MiddlewareFn } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { convertCurrencyValue } from "../httpClients/convertCurrencyValue.ts";

export const createCurrencyApiMiddleware = () => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    const withToken = <T>(params: T) => ({
      ...params,
      token: ctx.configuration.exchangeApiToken,
    });

    ctx.currencyApi = {
      convertCurrencyValue: (params) => convertCurrencyValue(withToken(params)),
    };

    return next();
  };

  return middleware;
};
