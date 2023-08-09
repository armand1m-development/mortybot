import { getLogger } from "std/log/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
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

        if (rank === 1) {
          return `${rank}. ${mention} - left the group ${metadata.count} times (the winner! 🏆)`;
        }

        return `${rank}. ${mention} - left the group ${metadata.count} times`;
      } catch (error) {
        getLogger().error(`Failed to fetch user with id ${userId}`);
        getLogger().error(error);
        return `${rank}. UID ${userId} - left the group ${metadata.count} times`;
      }
    }),
  );

  if (rank.length === 0) {
    return ctx.reply("Nobody ever left this group (at least not that I know).");
  }

  const message = `
**Leaving Rank**:

${rank.join("\n")}
`;

  await ctx.reply(message, {
    parse_mode: "Markdown",
  });
};
