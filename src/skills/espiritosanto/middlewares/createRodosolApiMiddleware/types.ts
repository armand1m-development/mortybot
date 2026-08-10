import type { FetchRodosolRoadImagesFunction } from "../../httpClients/fetchImages.ts";
import type { FetchThirdBridgeImagesFunction } from "../../httpClients/fetchThirdBridgeImages.ts";

export interface RodosolApiContext {
  rodosolApi: {
    fetchRodosolRoadImages: FetchRodosolRoadImagesFunction;
    fetchThirdBridgeImages: FetchThirdBridgeImagesFunction;
  };
}
