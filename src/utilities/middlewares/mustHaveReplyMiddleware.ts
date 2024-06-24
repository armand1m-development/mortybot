import type { BotContext } from "/src/context/mod.ts";
import type { CommandMiddleware } from "grammy/mod.ts";

export const mustHaveReplyMiddleware: CommandMiddleware<BotContext> = async (
  ctx,
  next,
) => {
  const reply = (ctx.msg ?? ctx.update.message).reply_to_message;

  if (!reply) {
    await ctx.reply(
      `You should run this command when replying to a message. Usage: reply a message with the command "${ctx.msg.text}"`,
    );
    return;
  }

  return next();
};
