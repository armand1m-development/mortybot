import { MiddlewareFn } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { injectToken } from "/src/utilities/injectToken.ts";
import { convertCurrencyValue } from "../../httpClients/convertCurrencyValue.ts";

export const createCurrencyApiMiddleware = () => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    ctx.currencyApi = {
      convertCurrencyValue: injectToken(
        ctx.configuration.exchangeApiToken,
        convertCurrencyValue,
      ),
    };

    return next();
  };

  return middleware;
};
