import { DOMParser } from "linkedom";
import { getLogger } from "std/log/mod.ts";

const logger = () => getLogger();

export const fetchImages = async () => {
  const response = await fetch("https://www.rodosol.com.br/de-olho-na-via/");
  const html = await response.text();
  const document = new DOMParser().parseFromString(html, "text/html");

  if (!document) {
    logger().error("Failed to parse document from Rodosol.");
    logger().debug({ html });

    throw new Error("Failed to parse document from Rodosol.");
  }

  const rodosolRoadNodes = document.querySelectorAll("[rel='prettyPhoto[RD]']");
  const thirdBridgeNodes = document.querySelectorAll("[rel='prettyPhoto[TP]']");

  return {
    rodosolRoadPicturesUrls: rodosolRoadNodes.map((node) =>
      node.getAttribute("href")
    ),
    thirdBridgePictureUrls: thirdBridgeNodes.map((node) =>
      node.getAttribute("href")
    ),
  };
};

export type FetchImagesFunction = typeof fetchImages;
