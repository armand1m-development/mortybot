import { getLogger } from "std/log/mod.ts";
import type { OmitToken } from "/src/types/OmitToken.ts";

export type CurrencyCode = `${Uppercase<string>}`;

const logger = () => getLogger();

export interface ExchangeRateApiPairResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  target_code: string;
  conversion_rate: number;
  conversion_result: number;
}

export interface ExchangeRateApiPairRequestParams {
  amount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  token: string;
}

const fetchExchangeRateApiCurrencyEndpoint = async ({
  amount,
  fromCurrency,
  toCurrency,
  token,
}: ExchangeRateApiPairRequestParams) => {
  // TODO: implement fallback
  // https://economia.awesomeapi.com.br/xml/USD-BRL/1?format=json
  const url =
    `https://v6.exchangerate-api.com/v6/${token}/pair/${fromCurrency}/${toCurrency}/${amount}`;

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    logger().error(`Failed to fetch currency value. Response body in debug.`);
    logger().debug(
      `Request params: ${
        JSON.stringify({ amount, fromCurrency, toCurrency }, null, 2)
      }`,
    );
    logger().debug(`Response Body: ${body}`);

    throw new Error("Failed to fetch currency value.");
  }

  const data = await response.json() as ExchangeRateApiPairResponse;

  return data;
};

export const convertCurrencyValue = async (
  params: ExchangeRateApiPairRequestParams,
) => {
  const currencyIntl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: params.toCurrency,
  });

  const response = await fetchExchangeRateApiCurrencyEndpoint(params);

  return currencyIntl.format(response.conversion_result);
};

export type ConvertCurrencyValueFunction = OmitToken<
  typeof convertCurrencyValue
>;

export interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: ConversionRates;
}

export type ConversionRates = Record<string, number>;

// export interface ConversionRates {
//   USD: number
//   AED: number
//   AFN: number
//   ALL: number
//   AMD: number
//   ANG: number
//   AOA: number
//   ARS: number
//   AUD: number
//   AWG: number
//   AZN: number
//   BAM: number
//   BBD: number
//   BDT: number
//   BGN: number
//   BHD: number
//   BIF: number
//   BMD: number
//   BND: number
//   BOB: number
//   BRL: number
//   BSD: number
//   BTN: number
//   BWP: number
//   BYN: number
//   BZD: number
//   CAD: number
//   CDF: number
//   CHF: number
//   CLP: number
//   CNY: number
//   COP: number
//   CRC: number
//   CUP: number
//   CVE: number
//   CZK: number
//   DJF: number
//   DKK: number
//   DOP: number
//   DZD: number
//   EGP: number
//   ERN: number
//   ETB: number
//   EUR: number
//   FJD: number
//   FKP: number
//   FOK: number
//   GBP: number
//   GEL: number
//   GGP: number
//   GHS: number
//   GIP: number
//   GMD: number
//   GNF: number
//   GTQ: number
//   GYD: number
//   HKD: number
//   HNL: number
//   HRK: number
//   HTG: number
//   HUF: number
//   IDR: number
//   ILS: number
//   IMP: number
//   INR: number
//   IQD: number
//   IRR: number
//   ISK: number
//   JEP: number
//   JMD: number
//   JOD: number
//   JPY: number
//   KES: number
//   KGS: number
//   KHR: number
//   KID: number
//   KMF: number
//   KRW: number
//   KWD: number
//   KYD: number
//   KZT: number
//   LAK: number
//   LBP: number
//   LKR: number
//   LRD: number
//   LSL: number
//   LYD: number
//   MAD: number
//   MDL: number
//   MGA: number
//   MKD: number
//   MMK: number
//   MNT: number
//   MOP: number
//   MRU: number
//   MUR: number
//   MVR: number
//   MWK: number
//   MXN: number
//   MYR: number
//   MZN: number
//   NAD: number
//   NGN: number
//   NIO: number
//   NOK: number
//   NPR: number
//   NZD: number
//   OMR: number
//   PAB: number
//   PEN: number
//   PGK: number
//   PHP: number
//   PKR: number
//   PLN: number
//   PYG: number
//   QAR: number
//   RON: number
//   RSD: number
//   RUB: number
//   RWF: number
//   SAR: number
//   SBD: number
//   SCR: number
//   SDG: number
//   SEK: number
//   SGD: number
//   SHP: number
//   SLE: number
//   SLL: number
//   SOS: number
//   SRD: number
//   SSP: number
//   STN: number
//   SYP: number
//   SZL: number
//   THB: number
//   TJS: number
//   TMT: number
//   TND: number
//   TOP: number
//   TRY: number
//   TTD: number
//   TVD: number
//   TWD: number
//   TZS: number
//   UAH: number
//   UGX: number
//   UYU: number
//   UZS: number
//   VES: number
//   VND: number
//   VUV: number
//   WST: number
//   XAF: number
//   XCD: number
//   XDR: number
//   XOF: number
//   XPF: number
//   YER: number
//   ZAR: number
//   ZMW: number
//   ZWL: number
// }

export const fetchExchangeRate = async ({
  token,
}: {
  token: string;
}) => {
  const url = `https://v6.exchangerate-api.com/v6/${token}/latest/USD`;

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    logger().error(
      `Failed to fetch latest exchange rate. Response body in debug.`,
    );
    logger().debug(`Response Body: ${body}`);
    throw new Error("Failed to fetch exchange rate.");
  }

  const data = await response.json() as ExchangeRateResponse;

  return data;
};

export type FetchExchangeRateFunction = OmitToken<
  typeof fetchExchangeRate
>;
