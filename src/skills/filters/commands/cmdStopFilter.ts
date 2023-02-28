import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdStopFilter: CommandMiddleware<BotContext> = (ctx) => {
  const trigger = ctx.match;

  if (!trigger) {
    return ctx.reply(
      "You should give me a filter to use. Example: `/stop_filter !myfilter`",
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
    active: false,
  });

  return ctx.reply(`Filter got deactivated.`);
};
