import { BotContext } from "/src/context/mod.ts";
import { CommandMiddleware } from "grammy/mod.ts";

export const mustHaveTextMiddleware: CommandMiddleware<BotContext> = async (
  ctx,
  next,
) => {
  const text = ctx.match;

  if (!text) {
    await ctx.reply(
      `Missing text. Usage: "${ctx.msg.text} text goes here"`,
    );
    return;
  }

  return next();
};
