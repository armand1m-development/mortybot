import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";

export const cmdToggleCaseSensitiveFilters: CommandMiddleware<BotContext> = (
  ctx,
) => {
  const filterSettings = ctx.session.filterSettings;
  ctx.session.filterSettings.caseSensitive = !filterSettings.caseSensitive;
  return ctx.reply(ctx.t("filters.caseSensitivity", {
    enabled: String(ctx.session.filterSettings.caseSensitive),
  }));
};
