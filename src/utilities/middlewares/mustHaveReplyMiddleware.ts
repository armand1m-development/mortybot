import type { BotContext } from "/src/context/mod.ts";
import type { CommandMiddleware } from "grammy";

export const mustHaveReplyMiddleware: CommandMiddleware<BotContext> = async (
  ctx,
  next,
) => {
  const reply = (ctx.msg ?? ctx.update.message).reply_to_message;

  if (!reply) {
    await ctx.reply(ctx.t("common.replyRequired", {
      command: ctx.msg.text,
    }));
    return;
  }

  return next();
};
