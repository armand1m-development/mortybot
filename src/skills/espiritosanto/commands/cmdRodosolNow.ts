import { getLogger } from "std/log/mod.ts";
import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdRodosolNow: CommandMiddleware<BotContext> = async (ctx) => {
  try {
    await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");

    const { rodosolRoadPicturesUrls } = await ctx.rodosolApi.fetchImages();

    await Promise.allSettled(rodosolRoadPicturesUrls.map((url) => {
      return ctx.replyWithPhoto(url);
    }));
  } catch (error) {
    getLogger().error(error);
    return ctx.reply("Failed to fetch rodosol camera pictures.");
  }
};
