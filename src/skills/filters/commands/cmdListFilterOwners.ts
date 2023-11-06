import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { getChunks } from "/src/utilities/array/getChunks.ts";

export const cmdListFilterOwners: CommandMiddleware<BotContext> = async (
  ctx,
) => {
  const filters = Object.fromEntries(ctx.session.filters);
  const entries = Object.entries(filters);

  if (entries.length === 0) {
    await ctx.reply("There are no filters defined for this group currently.");
    return;
  }

  const lines = await Promise.all(
    entries.map(async ([filterTrigger, filter]) => {
      const { user } = await ctx.getChatMember(filter.ownerId);
      return `- ${filterTrigger} (owner: @${user.username}, ${
        filter.active ? "active" : "stopped"
      })`;
    }),
  );

  const chunkedLines = getChunks(lines, 100);

  for (const chunk of chunkedLines) {
    await ctx.reply(chunk.join("\n"));
  }
};
