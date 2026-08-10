import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { createFilterActionAudit } from "../utilities/createFilterActionAudit.ts";
import { markdown } from "/src/utilities/formatMarkdown.ts";

export const cmdDeleteFilter: CommandMiddleware<BotContext> = (ctx) => {
  const trigger = ctx.match;

  if (!trigger) {
    return ctx.reply(ctx.t("filters.missingArgument.delete"));
  }

  const filter = ctx.session.filters.get(trigger);

  if (!filter) {
    return ctx.reply(ctx.t("filters.notFound", { filter: trigger }));
  }

  ctx.session.filters.delete(trigger);

  return ctx.reply(
    createFilterActionAudit({
      action: "deleted",
      filterTrigger: trigger,
      translate: ctx.t,
      user: ctx.from!,
    }),
    { parse_mode: markdown.parse_mode },
  );
};
