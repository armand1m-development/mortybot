import { getLogger } from "@std/log";
import { type CommandMiddleware, InputFile } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { decodeEmbeddedImageDataUrl } from "../utilities/decodeEmbeddedImageDataUrl.ts";

export const cmdTerceiraPonteNow: CommandMiddleware<BotContext> = async (
  ctx,
) => {
  let loadingMessageId: number | undefined;

  try {
    const loadingMessage = await ctx.reply(ctx.t("terceiraPonte.loading"));
    loadingMessageId = loadingMessage.message_id;

    await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");

    const thirdBridgePictures = await ctx.rodosolApi.fetchThirdBridgeImages();
    const media = thirdBridgePictures.map(({ dataUrl }, index) => {
      const image = decodeEmbeddedImageDataUrl(dataUrl);

      return {
        type: "photo" as const,
        media: new InputFile(
          image.bytes,
          `terceira-ponte-${index + 1}.${image.extension}`,
        ),
      };
    });

    await ctx.replyWithMediaGroup(media);
  } catch (error) {
    getLogger().error(error);
    return ctx.reply(ctx.t("terceiraPonte.error"));
  } finally {
    if (loadingMessageId !== undefined) {
      try {
        await ctx.api.deleteMessage(ctx.chat.id, loadingMessageId);
      } catch (error) {
        getLogger().warn(
          "Failed to delete Third Bridge loading message.",
          error,
        );
      }
    }
  }
};
