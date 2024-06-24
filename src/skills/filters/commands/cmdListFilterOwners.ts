import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";
import { getChunks } from "/src/utilities/array/getChunks.ts";
import { createMemberMention } from "/src/utilities/createMemberMention.ts";

export const cmdListFilterOwners: CommandMiddleware<BotContext> = async (
  ctx,
) => {
  const filters = Object.fromEntries(ctx.session.filters);
  const entries = Object.entries(filters);

  const lines = await Promise.all(
    entries.map(async ([filterTrigger, filter]) => {
      const userId = filter.ownerId;
      const chatMember = await ctx.getChatMember(userId);

      if (!chatMember) {
        return ` - UID ${userId}: ${filters.length}`;
      }

      const { user } = chatMember;
      const mention = createMemberMention(user, false);

      return `- ${filterTrigger} (owner: ${mention}, ${
        filter.active ? "active" : "stopped"
      })`;
    }),
  );

  if (lines.length === 0) {
    return ctx.reply("There are no filters defined for this group currently.");
  }

  const chunkedEntries = getChunks(lines, 100);

  for (const entrySet of chunkedEntries) {
    await ctx.reply(entrySet.join("\n"));
  }
};
