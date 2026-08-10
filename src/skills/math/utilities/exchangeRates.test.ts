import { assertEquals } from "@std/assert";
import type { ExchangeRateResponse } from "/src/skills/currency/httpClients/convertCurrencyValue.ts";
import {
  EXCHANGE_RATE_CACHE_FALLBACK_TTL_MS,
  getExchangeRateCacheTtlMs,
} from "./exchangeRates.ts";

const createRate = (timeNextUpdateUnix: number): ExchangeRateResponse => ({
  result: "success",
  documentation: "",
  terms_of_use: "",
  time_last_update_unix: 0,
  time_last_update_utc: "",
  time_next_update_unix: timeNextUpdateUnix,
  time_next_update_utc: "",
  base_code: "USD",
  conversion_rates: { USD: 1 },
});

Deno.test("exchange rate cache expires at the API's next update", () => {
  const loadedAt = 1_000_000;
  const nextUpdate = loadedAt + 30_000;

  assertEquals(
    getExchangeRateCacheTtlMs(createRate(nextUpdate / 1_000), loadedAt),
    30_000,
  );
});

Deno.test("exchange rate cache uses a fallback TTL for stale metadata", () => {
  assertEquals(
    getExchangeRateCacheTtlMs(createRate(1), 2_000),
    EXCHANGE_RATE_CACHE_FALLBACK_TTL_MS,
  );
});
