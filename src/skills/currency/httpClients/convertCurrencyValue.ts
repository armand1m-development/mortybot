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
