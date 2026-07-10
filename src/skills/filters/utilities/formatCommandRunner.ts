import type { BotContext } from "/src/context/mod.ts";

export const formatCommandRunner = (ctx: BotContext): string => {
  const username = ctx.from?.username ? `@${ctx.from.username}` : "unknown";
  const chatId = ctx.chat?.id.toString() ?? "unknown";

  return `username: ${username}, chatid: ${chatId}`;
};
