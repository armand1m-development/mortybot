import { getLogger } from "@std/log";
import type { OmitToken } from "/src/types/OmitToken.ts";
import type { QueryForecastResponse } from "./types/queryForecast.ts";
import type { Language } from "/src/i18n/mod.ts";

const logger = () => getLogger();

export interface QueryForecastParams {
  token: string;
  query: string;
  language?: Language;
}

export const getQueryForecastUrl = (
  { language = "en", query, token }: QueryForecastParams,
) => {
  const url = new URL("https://api.openweathermap.org/data/2.5/forecast");
  url.searchParams.set("q", query);
  url.searchParams.set("appid", token);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", language === "pt" ? "pt_br" : "en");
  return url.toString();
};

export const queryForecast = async (params: QueryForecastParams) => {
  const { query } = params;
  const response = await fetch(getQueryForecastUrl(params));

  if (!response.ok) {
    const body = await response.text();
    logger().error(
      `Failed to find the forecast for the specified query. Response body in debug.`,
    );
    logger().debug(
      `Request params: ${JSON.stringify({ query }, null, 2)}`,
    );
    logger().debug(`Response Body: ${body}`);

    throw new Error("Failed to find the forecast for the specified query.");
  }

  const data = await response.json() as QueryForecastResponse;

  return data;
};

export type QueryForecastFunction = OmitToken<typeof queryForecast>;
