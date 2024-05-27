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

  const chatMemberMap: Record<string, ChatMember> = {};

  const filtersPerUser: Record<number, Filter[]> = {};

  await Promise.all(
    entries.map(async (filter) => {
      const chatMember = chatMemberMap[filter.ownerId] ??
        await ctx.getChatMember(filter.ownerId);

      chatMemberMap[filter.ownerId] = chatMember;

      filtersPerUser[chatMember.user.id] ??= [];
      filtersPerUser[chatMember.user.id].push(filter);
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
        const chatMember = chatMemberMap[userId];
        if (!chatMember) {
          return ` - UID ${userId}: ${filters.length}`;
        }

        const { user } = chatMember;
        const mention = createMemberMention(user, false);
        return ` - ${mention}: ${filters.length}`;
      }).join("\n")
    }`;

    await ctx.reply(message, {
      parse_mode: "Markdown",
    });
  }

  await ctx.reply("There are no filters defined for this group currently.");
};
