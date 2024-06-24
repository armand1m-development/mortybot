import type { MiddlewareFn } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";
import type { Configuration } from "./types.ts";

export const createConfigurationMiddleware = (configuration: Configuration) => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    ctx.configuration = configuration;
    next();
  };

  return middleware;
};
