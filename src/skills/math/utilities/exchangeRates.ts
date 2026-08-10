import { getLogger } from "@std/log";
import {
  type ExchangeRateResponse,
  fetchExchangeRate,
  type FetchExchangeRateFunction,
} from "/src/skills/currency/httpClients/convertCurrencyValue.ts";
import { createTtlCache } from "/src/utilities/createTtlCache.ts";
import { injectToken } from "/src/utilities/injectToken.ts";
import { getSafeErrorSummary } from "/src/utilities/sanitizeLogText.ts";

export const EXCHANGE_RATE_CACHE_FALLBACK_TTL_MS = 60 * 60 * 1_000;
export const EXCHANGE_RATE_FAILURE_BACKOFF_MS = 30_000;

export const getExchangeRateCacheTtlMs = (
  rate: ExchangeRateResponse,
  loadedAt: number,
) => {
  const timeUntilNextUpdate = rate.time_next_update_unix * 1_000 - loadedAt;

  return Number.isFinite(timeUntilNextUpdate) && timeUntilNextUpdate > 0
    ? timeUntilNextUpdate
    : EXCHANGE_RATE_CACHE_FALLBACK_TTL_MS;
};

const exchangeRateCache = createTtlCache<ExchangeRateResponse>({
  failureTtlMs: EXCHANGE_RATE_FAILURE_BACKOFF_MS,
  ttlMs: getExchangeRateCacheTtlMs,
});

export const getExchangeRates = (exchangeApiToken: string) => {
  const fetchExchangeRateFn: FetchExchangeRateFunction = injectToken(
    exchangeApiToken,
    fetchExchangeRate,
  );

  return exchangeRateCache.get(() => {
    getLogger().info("Updating exchange rates for the math skill...");
    return fetchExchangeRateFn({}).catch((error) => {
      getLogger().warn(
        `Failed to update exchange rates: ${getSafeErrorSummary(error)}`,
      );
      throw error;
    });
  });
};
