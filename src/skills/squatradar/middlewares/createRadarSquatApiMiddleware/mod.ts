import type { MiddlewareFn } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";
import { fetchNextEvents } from "/src/skills/squatradar/httpClients/fetchNextEvents.ts";

export const createRadarSquatApiMiddlerware = () => {
  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    ctx.radarSquatApi = {
      fetchNextEvents: fetchNextEvents,
    };

    return next();
  };

  return middleware;
};
