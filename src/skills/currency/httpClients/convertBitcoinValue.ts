import { getLogger } from "std/log/mod.ts";

const logger = () => getLogger();

export interface MercadoBitcoinEndpointResult {
  ticker: {
    high: string;
    low: string;
    vol: string;
    last: string;
    buy: string;
    sell: string;
    open: string;
    date: number;
  };
}

export const fetchMercadoBitcoinValue = async () => {
  const mercadoBitcoinEndpoint =
    "https://www.mercadobitcoin.net/api/BTC/ticker/";
  const response = await fetch(mercadoBitcoinEndpoint);

  if (!response.ok) {
    const body = await response.text();
    logger().error(
      `Failed to fetch mercado bitcoin value. Response body in debug.`,
    );
    logger().debug(`Response Body: ${body}`);

    throw new Error("Failed to fetch mercado bitcoin value");
  }

  const data = await response.json() as MercadoBitcoinEndpointResult;

  return data;
};
