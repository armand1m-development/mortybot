import type { CommandContext } from "grammy/context.ts";
import type { BotContext } from "/src/context/mod.ts";
import { getFileBuffer } from "./getFileBuffer.ts";

export const getStickerImageBuffer = async (
  ctx: CommandContext<BotContext>,
) => {
  const sticker = ctx.msg.reply_to_message?.sticker;

  return !sticker ? null : await getFileBuffer(ctx, sticker.file_id);
};
