import { createUnit, math, type UnitDefinition } from "../utilities/mathjs.ts";
import {
  ExchangeRateResponse,
  fetchExchangeRate,
  FetchExchangeRateFunction,
} from "/src/skills/currency/httpClients/convertCurrencyValue.ts";
import { injectToken } from "/src/utilities/injectToken.ts";
import { MiddlewareFn } from "grammy";
import { BotContext } from "/src/context/mod.ts";
import { getLogger } from "@std/log";
import { createTtlCache } from "/src/utilities/createTtlCache.ts";

export const EXCHANGE_RATE_CACHE_FALLBACK_TTL_MS = 60 * 60 * 1_000;

export const getExchangeRateCacheTtlMs = (
  rate: ExchangeRateResponse,
  loadedAt: number,
) => {
  const timeUntilNextUpdate = rate.time_next_update_unix * 1_000 - loadedAt;

  return Number.isFinite(timeUntilNextUpdate) && timeUntilNextUpdate > 0
    ? timeUntilNextUpdate
    : EXCHANGE_RATE_CACHE_FALLBACK_TTL_MS;
};

export const createExchangeRateCacheMiddleware = () => {
  const exchangeRateCache = createTtlCache<ExchangeRateResponse>({
    ttlMs: getExchangeRateCacheTtlMs,
  });

  const middleware: MiddlewareFn<BotContext> = async (ctx, next) => {
    const fetchExchangeRateFn: FetchExchangeRateFunction = injectToken(
      ctx.configuration.exchangeApiToken,
      fetchExchangeRate,
    );

    const rate = await exchangeRateCache.get(() => {
      getLogger().info("Updating exchange rate for math skills..");
      return fetchExchangeRateFn({});
    });

    const rawUnits = Object
      .entries(rate.conversion_rates)
      .map(([currency, currencyRate]) => {
        const definition = math.unit &&
          math.unit(1 / currencyRate, rate.base_code);

        const unitDefinition: UnitDefinition = {
          definition,
          aliases: [currency, currency.toLowerCase()],
        };

        return [currency, unitDefinition];
      });

    const units = Object.fromEntries(rawUnits);

    createUnit(units, { override: true });

    return next();
  };

  return middleware;
};
