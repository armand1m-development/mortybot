import type { ConvertCurrencyValueFunction } from "../../httpClients/convertCurrencyValue.ts";

export interface CurrencyApiContext {
  currencyApi: {
    convertCurrencyValue: ConvertCurrencyValueFunction;
  };
}
