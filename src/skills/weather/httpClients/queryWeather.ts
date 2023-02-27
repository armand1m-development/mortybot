import { getLogger } from "std/log/mod.ts";
import { NoToken } from "/src/types/NoToken.ts";
import { QueryWeatherResponse } from "./types/queryWeather.ts";

function logger() {
  return getLogger("convertCurrencyValue");
}

export interface QueryWeatherParams {
  token: string;
  query: string;
}

export const getQueryWeatherUrl = ({ query, token }: QueryWeatherParams) =>
  `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${token}&units=metric`;

export const queryWeather = async ({ query, token }: QueryWeatherParams) => {
  const response = await fetch(getQueryWeatherUrl({ query, token }));

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

export type QueryWeatherFunction = (
  params: NoToken<QueryWeatherParams>,
) => ReturnType<typeof queryWeather>;