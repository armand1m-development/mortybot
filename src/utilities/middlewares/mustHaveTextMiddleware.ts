import type { BotContext } from "/src/context/mod.ts";
import type { CommandMiddleware } from "grammy";

export const mustHaveTextMiddleware: CommandMiddleware<BotContext> = async (
  ctx,
  next,
) => {
  const text = ctx.match;

  if (!text) {
    await ctx.reply(ctx.t("common.textRequired", {
      command: ctx.msg.text,
    }));
    return;
  }

  return next();
};
