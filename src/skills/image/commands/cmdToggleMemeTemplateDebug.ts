import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";

export const cmdToggleMemeTemplateDebug: CommandMiddleware<BotContext> = (
  ctx,
) => {
  ctx.session.enableMemeTemplateDebug = !ctx.session.enableMemeTemplateDebug;
  return ctx.reply(ctx.t("image.debugMode", {
    enabled: String(ctx.session.enableMemeTemplateDebug),
  }));
};
