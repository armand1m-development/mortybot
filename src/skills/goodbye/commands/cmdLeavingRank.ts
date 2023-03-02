import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { createMemberMention } from "/src/utilities/createMemberMention.ts";

export const cmdLeavingRank: CommandMiddleware<BotContext> = async (ctx) => {
  const goodbyeCounter = [...ctx.session.goodbyeCounter.entries()]
    .sort(([_keyA, valueA], [_keyB, valueB]) => {
      return valueB.count - valueA.count;
    });

  const rank = await Promise.all(
    goodbyeCounter.map(async ([userId, metadata], index) => {
      const rank = index + 1;

      const { user } = await ctx.getChatMember(userId);

      if (rank === 1) {
        return `${rank}. ${
          createMemberMention(user, false)
        } - left the group ${metadata.count} times (the winner! 🏆)`;
      }

      return `${rank}. ${
        createMemberMention(user, false)
      } - left the group ${metadata.count} times`;
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
