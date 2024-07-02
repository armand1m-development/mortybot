import type {
  ConvertCurrencyValueFunction,
  FetchExchangeRateFunction,
} from "../../httpClients/convertCurrencyValue.ts";

export interface CurrencyApiContext {
  currencyApi: {
    convertCurrencyValue: ConvertCurrencyValueFunction;
    fetchExchangeRate: FetchExchangeRateFunction;
  };
}
