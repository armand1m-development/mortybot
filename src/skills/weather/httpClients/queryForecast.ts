import { getLogger } from "std/log/mod.ts";
import { NoToken } from "/src/types/NoToken.ts";
import { QueryForecastResponse } from "./types/queryForecast.ts";

function logger() {
  return getLogger("queryForecast");
}

export interface QueryForecastParams {
  token: string;
  query: string;
}

export const getQueryForecastUrl = ({ query, token }: QueryForecastParams) =>
  `https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${token}&units=metric`;

export const queryForecast = async ({ query, token }: QueryForecastParams) => {
  const response = await fetch(getQueryForecastUrl({ query, token }));

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

export type QueryForecastFunction = (
  params: NoToken<QueryForecastParams>,
) => ReturnType<typeof queryForecast>;
