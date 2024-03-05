import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdGetChatId: CommandMiddleware<BotContext> = (ctx) => {
  return ctx.reply(`${ctx.chat?.id}`);
};
