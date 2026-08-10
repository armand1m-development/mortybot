import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import type { ChatMember } from "grammy/types";
import type { Filter } from "/src/skills/filters/sessionData/types.ts";
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
    const entries = sortedEntries.map(([userId, filters]) => {
      const chatMember = chatMemberMap[userId];
      if (!chatMember) {
        return ctx.t("filters.ownerCount.unknownOwner", {
          count: filters.length,
          ownerId: userId,
        });
      }

      const { user } = chatMember;
      const mention = createMemberMention(user, false);
      return ctx.t("filters.ownerCount.entry", {
        count: filters.length,
        owner: mention,
      });
    }).join("\n");

    const message = ctx.t("filters.ownerCount.heading", { entries });

    await ctx.reply(message, {
      parse_mode: "Markdown",
    });
    return;
  }

  await ctx.reply(ctx.t("filters.none"));
};
