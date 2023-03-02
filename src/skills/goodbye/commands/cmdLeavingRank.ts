import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdLeavingRank: CommandMiddleware<BotContext> = async (ctx) => {
  const goodbyeCounter = [...ctx.session.goodbyeCounter.entries()]
    .sort(([_keyA, valueA], [_keyB, valueB]) => {
      return valueA.count - valueB.count;
    });

  const rank = goodbyeCounter.map(([userId, metadata], index) => {
    const rank = index + 1;

    if (rank === 1) {
      return `🏆 ${rank}. ${userId} - left the group ${metadata.count} times`;
    }

    return `${rank}. ${userId} - left the group ${metadata.count} times`;
  });

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
