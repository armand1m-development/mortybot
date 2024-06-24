import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdToggleMemeTemplateDebug: CommandMiddleware<BotContext> = (
  ctx,
) => {
  ctx.session.enableMemeTemplateDebug = !ctx.session.enableMemeTemplateDebug;
  return ctx.reply(
    `Meme template debug mode is now ${
      ctx.session.enableMemeTemplateDebug ? "enabled" : "disabled"
    }`,
  );
};
