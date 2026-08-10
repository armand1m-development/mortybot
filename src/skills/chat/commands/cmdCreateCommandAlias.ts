import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";

export const cmdCreateCommandAlias: CommandMiddleware<BotContext> = (
  ctx,
) => {
  return ctx.reply(ctx.t("chat.aliasNotImplemented"));
};
