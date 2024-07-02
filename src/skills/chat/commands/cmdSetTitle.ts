import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdSetTitle: CommandMiddleware<BotContext> = (ctx) => {
  return ctx.setChatTitle(ctx.match);
};
