import type { BotContext } from "/src/context/mod.ts";

export const deleteAndReply = async (ctx: BotContext, text: string) => {
  await Promise.allSettled([
    ctx.deleteMessage(),
    ctx.reply(text),
  ]);
};
