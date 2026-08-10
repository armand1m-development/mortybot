import type { Middleware } from "grammy";
import type { Filter } from "grammy";
import { getLogger } from "@std/log";
import type { BotContext } from "/src/context/mod.ts";

export const goodbyeListener: Middleware<
  Filter<BotContext, ":left_chat_member">
> = async (
  ctx,
) => {
  await ctx.reply(ctx.t("goodbye.farewell"), {
    reply_to_message_id: ctx.message?.message_id,
  });

  const authorId = ctx.from?.id;
  const user = ctx.msg.left_chat_member;
  const userId = user.id;

  if (authorId !== userId) {
    getLogger().info(
      `User with id ${userId} was removed by ${authorId}. Not adding to counter.`,
    );
    return;
  }

  if (ctx.session.goodbyeCounter.has(userId)) {
    const current = ctx.session.goodbyeCounter.get(userId)!;
    ctx.session.goodbyeCounter.set(userId, {
      count: current.count + 1,
      user,
      userId,
    });
    return;
  }

  ctx.session.goodbyeCounter.set(userId, {
    count: 1,
    user,
    userId,
  });
};
