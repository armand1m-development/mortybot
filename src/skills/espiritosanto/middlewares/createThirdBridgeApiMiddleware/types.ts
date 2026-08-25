import type { FetchThirdBridgeImagesFunction } from "../../httpClients/fetchThirdBridgeImages.ts";

export interface ThirdBridgeApiContext {
  thirdBridgeApi: {
    fetchThirdBridgeImages: FetchThirdBridgeImagesFunction;
  };
}
