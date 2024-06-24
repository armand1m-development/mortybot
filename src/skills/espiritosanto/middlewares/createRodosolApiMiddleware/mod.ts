import type { MiddlewareFn } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";
import { fetchImages } from "../../httpClients/fetchImages.ts";

export const createRodosolApiMiddleware = () => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    ctx.rodosolApi = { fetchImages };
    return next();
  };

  return middleware;
};
