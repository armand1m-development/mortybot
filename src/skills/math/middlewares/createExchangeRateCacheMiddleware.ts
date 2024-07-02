import { createUnit, math, UnitDefinition } from "../utilities/mathjs.ts";
import {
  ExchangeRateResponse,
  fetchExchangeRate,
  FetchExchangeRateFunction,
} from "/src/skills/currency/httpClients/convertCurrencyValue.ts";
import { injectToken } from "/src/utilities/injectToken.ts";
import { MiddlewareFn } from "grammy/mod.ts";
import { BotContext } from "/src/context/mod.ts";
import { LRU } from "https://deno.land/x/lru@1.0.2/mod.ts";
import { getLogger } from "std/log/mod.ts";

export const createExchangeRateCacheMiddleware = () => {
  const lru = new LRU<ExchangeRateResponse>(2);
  const middleware: MiddlewareFn<BotContext> = async (ctx, next) => {
    const fetchExchangeRateFn: FetchExchangeRateFunction = injectToken(
      ctx.configuration.exchangeApiToken,
      fetchExchangeRate,
    );

    if (!lru.has("exchangeRate")) {
      getLogger().info("Updating exchange rate for math skills..");
      const rate = await fetchExchangeRateFn({});
      lru.set("exchangeRate", rate);
    }

    const rate = lru.get("exchangeRate")!;

    const rawUnits = Object
      .entries(rate.conversion_rates)
      .map(([currency, currencyRate]) => {
        const definition = math.unit &&
          math.unit(1 / currencyRate, rate.base_code);

        const unitDefinition: UnitDefinition = {
          definition,
          aliases: [currency],
        };

        return [currency, unitDefinition];
      });

    const units = Object.fromEntries(rawUnits);

    createUnit(units, { override: true });

    return next();
  };

  return middleware;
};
