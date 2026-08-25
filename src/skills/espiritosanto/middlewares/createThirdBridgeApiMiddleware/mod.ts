import type { MiddlewareFn } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { fetchThirdBridgeImages } from "../../httpClients/fetchThirdBridgeImages.ts";

export const createThirdBridgeApiMiddleware = () => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    ctx.thirdBridgeApi = { fetchThirdBridgeImages };
    return next();
  };

  return middleware;
};
