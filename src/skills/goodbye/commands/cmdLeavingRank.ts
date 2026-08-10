import { getLogger } from "@std/log";
import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { createMemberMention } from "/src/utilities/createMemberMention.ts";

export const cmdLeavingRank: CommandMiddleware<BotContext> = async (ctx) => {
  await ctx.api.sendChatAction(ctx.chat.id, "typing");

  const goodbyeCounter = [...ctx.session.goodbyeCounter.entries()]
    .sort(([_keyA, valueA], [_keyB, valueB]) => {
      return valueB.count - valueA.count;
    });

  const rank = await Promise.all(
    goodbyeCounter.map(async ([userId, metadata], index) => {
      const rank = index + 1;

      try {
        const { user } = await ctx.getChatMember(userId);
        const mention = createMemberMention(user, false);

        return ctx.t("goodbye.entry", {
          count: metadata.count,
          rank,
          user: mention,
          winner: String(rank === 1),
        });
      } catch (error) {
        getLogger().error(`Failed to fetch user with id ${userId}`);
        getLogger().error(error);
        return ctx.t("goodbye.unknownUserEntry", {
          count: metadata.count,
          rank,
          userId,
          winner: String(rank === 1),
        });
      }
    }),
  );

  if (rank.length === 0) {
    return ctx.reply(ctx.t("goodbye.none"));
  }

  const message = ctx.t("goodbye.heading", { entries: rank.join("\n") });

  await ctx.reply(message, {
    parse_mode: "Markdown",
  });
};
