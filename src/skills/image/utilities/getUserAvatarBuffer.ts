import type { CommandContext } from "grammy/context.ts";
import type { BotContext } from "/src/context/mod.ts";
import { getFileBuffer } from "./getFileBuffer.ts";

export const getUserAvatarBuffer = async (ctx: CommandContext<BotContext>) => {
  const userId = ctx.msg.reply_to_message?.from?.id;

  if (!userId) {
    return null;
  }

  const userAvatar = await ctx.api.getUserProfilePhotos(userId);

  if (userAvatar.total_count === 0) {
    return null;
  }

  const photoSizes = userAvatar.photos[0];
  const highestResAvatar = photoSizes[photoSizes.length - 1];
  return await getFileBuffer(ctx, highestResAvatar.file_id);
};
