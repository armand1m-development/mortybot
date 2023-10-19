import { getLogger } from "std/log/mod.ts";
import { GeoPosition } from "../commands/types.ts";
import { OmitToken } from "/src/types/OmitToken.ts";
import { N2yoVisualPasses } from "./types.ts";

const logger = () => getLogger();

const baseUrl = "https://api.n2yo.com";

type FetchIssPassesParams = GeoPosition & { token: string };

export const fetchIssPasses = async ({
  latitude,
  longitude,
  token,
}: FetchIssPassesParams) => {
  const issSatCode = 25544;
  const numberOfDays = 3;
  const secondsOfVisibility = 550;

  const response = await fetch(
    `${baseUrl}/rest/v1/satellite/visualpasses/${issSatCode}/${latitude}/${longitude}/0/${numberOfDays}/${secondsOfVisibility}/&apiKey=${token}`,
  );

  if (!response.ok) {
    const body = await response.text();
    logger().error(
      `Failed to find iss passes for the specified query. Response body in debug.`,
    );
    logger().debug(
      `Request params: ${JSON.stringify({ latitude, longitude }, null, 2)}`,
    );
    logger().debug(`Response Body: ${body}`);

    throw new Error("Failed to find iss passes");
  }

  const passes = await response.json();

  return passes as N2yoVisualPasses;
};

export type FetchIssPassesFunction = OmitToken<typeof fetchIssPasses>;
