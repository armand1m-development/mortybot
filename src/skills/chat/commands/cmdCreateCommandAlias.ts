import type { CommandMiddleware } from "grammy/mod.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdCreateCommandAlias: CommandMiddleware<BotContext> = (
  ctx,
) => {
  return ctx.reply("Command alias creation still not implemented.");
};
