import { getLogger } from "std/log/mod.ts";

export type CurrencyCode = `${Uppercase<string>}` & { length: 3 };

function logger() {
  return getLogger("convertCurrencyValue");
}

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

export type ConvertCurrencyValueFunctionPure = typeof convertCurrencyValue;

export const withToken =
  (token: string) =>
  (params: Omit<ExchangeRateApiPairRequestParams, "token">) => {
    return convertCurrencyValue({ ...params, token });
  };

export type ConvertCurrencyValueFunction = ReturnType<typeof withToken>;
