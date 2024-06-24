import type { CommandMiddleware } from "grammy/composer.ts";
import { getChunks } from "/src/utilities/array/getChunks.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdListHashtags: CommandMiddleware<BotContext> = async (ctx) => {
  const filters = Object.fromEntries(ctx.session.hashtagChannels);
  const entries = Object.entries(filters);

  if (entries.length === 0) {
    await ctx.reply("There are no hashtags defined for this group currently.");
    return;
  }

  const chunkedEntries = getChunks(entries, 100);

  for (const entrySet of chunkedEntries) {
    const lines = entrySet.map(([hashtag, hashtagProps]) => {
      return `- ${hashtag} (${hashtagProps.participants.length} registered)`;
    });

    await ctx.reply(lines.join("\n"));
  }
};
