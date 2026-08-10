import type { MiddlewareFn } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { fetchRodosolRoadImages } from "../../httpClients/fetchImages.ts";
import { fetchThirdBridgeImages } from "../../httpClients/fetchThirdBridgeImages.ts";

export const createRodosolApiMiddleware = () => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    ctx.rodosolApi = {
      fetchRodosolRoadImages,
      fetchThirdBridgeImages,
    };
    return next();
  };

  return middleware;
};
