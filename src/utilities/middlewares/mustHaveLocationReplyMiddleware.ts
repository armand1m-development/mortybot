import { BotContext } from "/src/context/mod.ts";
import { CommandMiddleware } from "grammy/mod.ts";

export const mustHaveLocationReplyMiddleware: CommandMiddleware<BotContext> =
  async (
    ctx,
    next,
  ) => {
    const reply = (ctx.msg ?? ctx.update.message).reply_to_message;

    if (!reply?.location) {
      await ctx.reply(
        `The reply message should be a location message. Usage: reply a location message with the command "${ctx.msg.text}"`,
      );
      return;
    }

    return next();
  };
