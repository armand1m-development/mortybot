import { getLogger } from "std/log/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdTerceiraPonteNow: CommandMiddleware<BotContext> = async (
  ctx,
) => {
  try {
    const { thirdBridgePictureUrls } = await ctx.rodosolApi.fetchImages();

    await Promise.allSettled(thirdBridgePictureUrls.map((url) => {
      return ctx.replyWithPhoto(url);
    }));
  } catch (error) {
    getLogger().error(error);
    return ctx.reply("Failed to fetch third bridge camera pictures.");
  }
};
