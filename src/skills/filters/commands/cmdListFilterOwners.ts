import type { CommandMiddleware } from "grammy";
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
        return ctx.t("filters.ownerList.unknownOwner", {
          filter: filterTrigger,
          ownerId: userId,
        });
      }

      const { user } = chatMember;
      const mention = createMemberMention(user, false);

      return ctx.t("filters.ownerList.entry", {
        active: String(filter.active),
        filter: filterTrigger,
        owner: mention,
      });
    }),
  );

  if (lines.length === 0) {
    return ctx.reply(ctx.t("filters.none"));
  }

  const chunkedEntries = getChunks(lines, 100);

  for (const entrySet of chunkedEntries) {
    await ctx.reply(entrySet.join("\n"));
  }
};
