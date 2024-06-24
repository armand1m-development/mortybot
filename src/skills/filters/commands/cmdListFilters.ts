import type { CommandMiddleware } from "grammy/composer.ts";
import { getChunks } from "/src/utilities/array/getChunks.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdListFilters: CommandMiddleware<BotContext> = async (ctx) => {
  const filters = Object.fromEntries(ctx.session.filters);
  const entries = Object.entries(filters);

  if (entries.length === 0) {
    await ctx.reply("There are no filters defined for this group currently.");
    return;
  }

  const chunkedEntries = getChunks(entries, 100);

  for (const entrySet of chunkedEntries) {
    const message = entrySet
      .filter(([, filter]) => filter.active)
      .map(([filterTrigger]) => `- ${filterTrigger}`)
      .join("\n");

    await ctx.reply(message);
  }
};
