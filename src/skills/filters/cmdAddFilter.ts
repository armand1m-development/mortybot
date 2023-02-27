import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdAddFilter: CommandMiddleware<BotContext> = async (ctx) => {
  const commandArgs = ctx.match;

  await ctx.reply("should add filter");
};
