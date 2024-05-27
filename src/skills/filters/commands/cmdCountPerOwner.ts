import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { ChatMember } from "grammy/types.ts";
import { Filter } from "/src/skills/filters/sessionData/types.ts";
import { createMemberMention } from "/src/utilities/createMemberMention.ts";

export const cmdCountPerOwner: CommandMiddleware<BotContext> = async (
  ctx,
) => {
  await ctx.api.sendChatAction(ctx.chat.id, "typing");

  const filters = Object.fromEntries(ctx.session.filters);
  const entries = Object.values(filters);

  const chatMemberMap: Record<number, ChatMember> = {};

  const filtersPerUser: Record<number, Filter[]> = {};

  await Promise.all(
    entries.map(async (filter) => {
      const { user } = chatMemberMap[filter.ownerId] ??
        await ctx.getChatMember(filter.ownerId);

      filtersPerUser[user.id] ??= [];
      filtersPerUser[user.id].push(filter);
    }),
  );

  const sortedEntries = Object.entries(filtersPerUser).sort(
    ([, filtersA], [, filtersB]) => {
      return filtersB.length - filtersA.length;
    },
  );

  const hasEntries = sortedEntries.length > 0;

  if (hasEntries) {
    const message = `
**Filters per Owner**:

${
      sortedEntries.map(([userId, filters]) => {
        const chatMember = chatMemberMap[Number(userId)];
        if (!chatMember) {
          return ` - UID ${userId}: ${filters.length} filters`;
        }

        const { user } = chatMember;
        const mention = createMemberMention(user, false);
        return ` - ${mention}: ${filters.length} filters`;
      }).join("\n")
    }`;
    await ctx.reply(message);
  }

  await ctx.reply("There are no filters defined for this group currently.");
};
