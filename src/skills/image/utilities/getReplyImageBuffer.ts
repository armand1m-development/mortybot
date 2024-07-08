import type { CommandContext } from "grammy/context.ts";
import type { BotContext } from "/src/context/mod.ts";
import { getFileBuffer } from "./getFileBuffer.ts";

export const getReplyImageBuffer = async (ctx: CommandContext<BotContext>) => {
  const photos = ctx.msg.reply_to_message?.photo;
  const hasPhotos = photos && photos.length > 0;

  return hasPhotos ? await getFileBuffer(ctx, photos[0].file_id) : null;
};
