import type { CommandContext } from "grammy/context.ts";
import type { BotContext } from "/src/context/mod.ts";

export const getUserAvatarBuffer = async (ctx: CommandContext<BotContext>) => {
  const replyMessage = ctx.msg.reply_to_message;
  const userId = replyMessage?.from?.id;

  if (userId !== undefined) {
    const userAvatar = await ctx.api.getUserProfilePhotos(userId);

    if (userAvatar.total_count === 0) {
      return null;
    }

    const photoSizes = userAvatar.photos[0];
    const highestResAvatar = photoSizes[photoSizes.length - 1];
    const file = await ctx.api.getFile(highestResAvatar.file_id);
    const url = file.getUrl();
    const avatarResponse = await fetch(url);
    const avatarBuffer = await avatarResponse.arrayBuffer();

    return avatarBuffer;
  }

  return null;
};
