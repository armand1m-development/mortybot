import type { CommandMiddleware } from "grammy/mod.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdCreateCommandAlias: CommandMiddleware<BotContext> = async (
  ctx,
) => {
  const alias = ctx.match;

  return ctx.reply("Command alias creation still not implemented.");
};
