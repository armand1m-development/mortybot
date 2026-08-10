import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { createFilterActionAudit } from "../utilities/createFilterActionAudit.ts";
import { markdown } from "/src/utilities/formatMarkdown.ts";

export const cmdStopFilter: CommandMiddleware<BotContext> = (ctx) => {
  const trigger = ctx.match;

  if (!trigger) {
    return ctx.reply(ctx.t("filters.missingArgument.stop"));
  }

  const filter = ctx.session.filters.get(trigger);

  if (!filter) {
    return ctx.reply(ctx.t("filters.notFound", { filter: trigger }));
  }

  ctx.session.filters.set(trigger, {
    ...filter,
    active: false,
  });

  return ctx.reply(
    createFilterActionAudit({
      action: "deactivated",
      filterTrigger: trigger,
      translate: ctx.t,
      user: ctx.from!,
    }),
    { parse_mode: markdown.parse_mode },
  );
};
