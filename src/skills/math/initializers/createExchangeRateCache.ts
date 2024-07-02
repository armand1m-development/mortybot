import { createUnit, math } from "../utilities/mathjs.ts";
import {
  fetchExchangeRate,
  FetchExchangeRateFunction,
} from "/src/skills/currency/httpClients/convertCurrencyValue.ts";
import { injectToken } from "/src/utilities/injectToken.ts";
import { Configuration } from "/src/platform/configuration/middlewares/types.ts";
import { getLogger } from "std/log/mod.ts";

export const createExchangeRateCache = async (configuration: Configuration) => {
  const fetchExchangeRateFn: FetchExchangeRateFunction = injectToken(
    configuration.exchangeApiToken,
    fetchExchangeRate,
  );

  getLogger().info("Updating exchange rate for math skills..");
  const rate = await fetchExchangeRateFn({});

  // @ts-ignore: this works, but types are wrong
  createUnit(rate.base_code, { override: true });

  Object
    .entries(rate.conversion_rates)
    .forEach(([currency, currencyRate]) => {
      if (currency === rate.base_code) {
        return;
      }

      if (!math.unit) {
        return;
      }

      const definition = math.unit(1 / currencyRate, rate.base_code);

      // @ts-ignore: this works, but types are wrong
      createUnit(currency, definition, { override: true });
    });
};
