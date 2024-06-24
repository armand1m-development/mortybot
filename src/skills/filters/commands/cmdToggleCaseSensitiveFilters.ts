import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdToggleCaseSensitiveFilters: CommandMiddleware<BotContext> = (
  ctx,
) => {
  const filterSettings = ctx.session.filterSettings;
  ctx.session.filterSettings.caseSensitive = !filterSettings.caseSensitive;
  return ctx.reply(
    `Filter Case Sensitive setting is now ${
      ctx.session.filterSettings.caseSensitive ? '"on"' : '"off"'
    }.`,
  );
};
