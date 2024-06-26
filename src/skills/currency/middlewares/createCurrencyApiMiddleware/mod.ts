import type { MiddlewareFn } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";
import { injectToken } from "/src/utilities/injectToken.ts";
import {
  convertCurrencyValue,
  fetchExchangeRate,
} from "../../httpClients/convertCurrencyValue.ts";

export const createCurrencyApiMiddleware = () => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    ctx.currencyApi = {
      convertCurrencyValue: injectToken(
        ctx.configuration.exchangeApiToken,
        convertCurrencyValue,
      ),
      fetchExchangeRate: injectToken(
        ctx.configuration.exchangeApiToken,
        fetchExchangeRate,
      ),
    };

    return next();
  };

  return middleware;
};
