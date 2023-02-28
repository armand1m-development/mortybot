import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdListFilters: CommandMiddleware<BotContext> = async (ctx) => {
  const filters = Object.fromEntries(ctx.session.filters);
  const entries = Object.entries(filters);

  const lines = await Promise.all(
    entries.map(async ([filterTrigger, filter]) => {
      const { user } = await ctx.getChatMember(filter.ownerId);
      return `- ${filterTrigger} (created by @${user.username})`;
    }),
  );

  await ctx.reply(lines.join("\n"));
};
