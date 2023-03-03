import { Middleware } from "grammy/composer.ts";
import { Filter } from "grammy/filter.ts";
import { BotContext } from "/src/context/mod.ts";

export const goodbyeListener: Middleware<
  Filter<BotContext, ":left_chat_member">
> = async (
  ctx,
) => {
  await ctx.reply("Was nice to see you!", {
    reply_to_message_id: ctx.message?.message_id,
  });

  const userId = ctx.msg.left_chat_member.id;

  if (ctx.session.goodbyeCounter.has(userId)) {
    const current = ctx.session.goodbyeCounter.get(userId)!;
    ctx.session.goodbyeCounter.set(userId, {
      userId,
      count: current.count + 1,
    });
    return;
  }

  ctx.session.goodbyeCounter.set(userId, {
    userId,
    count: 1,
  });
};
