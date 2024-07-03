import type { CommandContext } from "grammy/context.ts";
import type { BotContext } from "/src/context/mod.ts";

export const getReplyImageBuffer = async (ctx: CommandContext<BotContext>) => {
  const replyMessage = ctx.msg.reply_to_message;
  const photos = replyMessage?.photo;

  if (photos !== undefined) {
    if (photos.length === 0) {
      return null;
    }

    const file = await ctx.api.getFile(photos[0].file_id);
    const url = file.getUrl();
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    return buffer;
  }

  return null;
};
