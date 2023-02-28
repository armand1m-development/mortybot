import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdListFilters: CommandMiddleware<BotContext> = async (ctx) => {
  const filters = Object.fromEntries(ctx.session.filters);
  const entries = Object.entries(filters);

  const lines = entries.map(([filterTrigger, filter]) => {
    return `- ${filterTrigger} (${filter.active ? "active" : "stopped"})`;
  });

  const message = lines.length > 0
    ? lines.join("\n")
    : "There are no filters defined for this group currently.";

  await ctx.reply(message);
};
