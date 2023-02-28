import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdListFilterOwners: CommandMiddleware<BotContext> = async (
  ctx,
) => {
  const filters = Object.fromEntries(ctx.session.filters);
  const entries = Object.entries(filters);

  const lines = await Promise.all(
    entries.map(async ([filterTrigger, filter]) => {
      const { user } = await ctx.getChatMember(filter.ownerId);
      return `- ${filterTrigger} (owner: @${user.username}, ${
        filter.active ? "active" : "stopped"
      })`;
    }),
  );

  const message = lines.length > 0
    ? lines.join("\n")
    : "There are no filters defined for this group currently.";

  await ctx.reply(message);
};
