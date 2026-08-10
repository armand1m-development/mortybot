import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";

export const cmdActivateFilter: CommandMiddleware<BotContext> = (ctx) => {
  const trigger = ctx.match;

  if (!trigger) {
    return ctx.reply(ctx.t("filters.missingArgument.activate"));
  }

  const filter = ctx.session.filters.get(trigger);

  if (!filter) {
    return ctx.reply(ctx.t("filters.notFound", { filter: trigger }));
  }

  ctx.session.filters.set(trigger, {
    ...filter,
    active: true,
  });

  return ctx.reply(ctx.t("filters.activated"));
};
