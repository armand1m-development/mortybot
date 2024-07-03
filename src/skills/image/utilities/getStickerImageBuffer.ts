import type { CommandContext } from "grammy/context.ts";
import type { BotContext } from "/src/context/mod.ts";

export const getStickerImageBuffer = async (
  ctx: CommandContext<BotContext>,
) => {
  const replyMessage = ctx.msg.reply_to_message;
  const sticker = replyMessage?.sticker;

  if (sticker !== undefined) {
    const file = await ctx.api.getFile(sticker.file_id);
    const url = file.getUrl();
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    return buffer;
  }

  return null;
};
