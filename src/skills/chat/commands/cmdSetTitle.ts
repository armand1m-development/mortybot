import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdSetTitle: CommandMiddleware<BotContext> = async (ctx) => {
  const newChatTitle = ctx.match;

  if (!newChatTitle) {
    await ctx.reply(
      "Missing chat title. Usage: `/set_title new group title`",
    );
    return;
  }

  await ctx.setChatTitle(newChatTitle);
};
