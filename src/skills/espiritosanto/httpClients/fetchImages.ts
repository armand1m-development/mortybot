import { DOMParser } from "linkedom";
import { getLogger } from "@std/log";

const logger = () => getLogger();

export const fetchRodosolRoadImages = async (): Promise<string[]> => {
  const response = await fetch("https://www.rodosol.com.br/de-olho-na-via/");

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Rodosol cameras: HTTP ${response.status}.`,
    );
  }

  const html = await response.text();
  const document = new DOMParser().parseFromString(html, "text/html");

  if (!document) {
    logger().error("Failed to parse document from Rodosol.");
    logger().debug({ html });

    throw new Error("Failed to parse document from Rodosol.");
  }

  const rodosolRoadNodes = document.querySelectorAll("[rel='prettyPhoto[RD]']");
  const getHref = (node: Element) => node.getAttribute("href");
  const isUrl = (url: string | null): url is string => url !== null;

  return rodosolRoadNodes.map(getHref).filter(isUrl);
};

export type FetchRodosolRoadImagesFunction = typeof fetchRodosolRoadImages;
