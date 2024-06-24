import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdActivateFilter: CommandMiddleware<BotContext> = (ctx) => {
  const trigger = ctx.match;

  if (!trigger) {
    return ctx.reply(
      "You should give me a filter to use. Example: `/activate_filter !myfilter`",
    );
  }

  const filter = ctx.session.filters.get(trigger);

  if (!filter) {
    return ctx.reply(
      `Couldn't find a filter for this trigger "${trigger}"`,
    );
  }

  ctx.session.filters.set(trigger, {
    ...filter,
    active: true,
  });

  return ctx.reply(`Filter got activated.`);
};
