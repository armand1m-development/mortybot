import { getLogger } from "@std/log";
import type { OmitToken } from "/src/types/OmitToken.ts";
import type { QueryWeatherResponse } from "./types/queryWeather.ts";
import type { Language } from "/src/i18n/mod.ts";

const logger = () => getLogger();

export interface QueryWeatherParams {
  token: string;
  query: string;
  language?: Language;
}

export const getQueryWeatherUrl = (
  { language = "en", query, token }: QueryWeatherParams,
) => {
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("q", query);
  url.searchParams.set("appid", token);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", language === "pt" ? "pt_br" : "en");
  return url.toString();
};

export const queryWeather = async (params: QueryWeatherParams) => {
  const { query } = params;
  const response = await fetch(getQueryWeatherUrl(params));

  if (!response.ok) {
    const body = await response.text();
    logger().error(
      `Failed to find weather for the specified query. Response body in debug.`,
    );
    logger().debug(
      `Request params: ${JSON.stringify({ query }, null, 2)}`,
    );
    logger().debug(`Response Body: ${body}`);

    throw new Error("Failed to find weather for the specified query.");
  }

  const data = await response.json() as QueryWeatherResponse;

  return data;
};

export type QueryWeatherFunction = OmitToken<typeof queryWeather>;
