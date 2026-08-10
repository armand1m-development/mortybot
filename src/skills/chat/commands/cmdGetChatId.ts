import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";

export const cmdGetChatId: CommandMiddleware<BotContext> = (ctx) => {
  return ctx.reply(`${ctx.chat?.id}`);
};
