import { getLogger } from "@std/log";
import { type CommandMiddleware, InputFile } from "grammy";
import type { BotContext } from "/src/context/mod.ts";

export const cmdTerceiraPonteNow: CommandMiddleware<BotContext> = async (
  ctx,
) => {
  let loadingMessageId: number | undefined;

  try {
    const loadingMessage = await ctx.reply(ctx.t("terceiraPonte.loading"));
    loadingMessageId = loadingMessage.message_id;

    await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");

    const { images, failures } = await ctx.thirdBridgeApi
      .fetchThirdBridgeImages();

    if (images.length === 0) {
      getLogger().error(
        "Third Bridge cameras all failed.",
        failures.map(({ camera, error }) => ({ camera: camera.id, error })),
      );
      return ctx.reply(ctx.t("terceiraPonte.error"));
    }

    if (failures.length > 0) {
      getLogger().warn(
        "Third Bridge cameras partially failed.",
        failures.map(({ camera, error }) => ({ camera: camera.id, error })),
      );
    }

    const media = images.map(({ bytes, extension }, index) => ({
      type: "photo" as const,
      media: new InputFile(
        bytes,
        `terceira-ponte-${index + 1}.${extension}`,
      ),
    }));

    const album = await ctx.replyWithMediaGroup(media);

    if (failures.length > 0) {
      const total = images.length + failures.length;
      await ctx.reply(
        ctx.t("terceiraPonte.partial", {
          available: String(images.length),
          total: String(total),
        }),
        album.length > 0 && album[0] !== undefined
          ? { reply_parameters: { message_id: album[0].message_id } }
          : undefined,
      );
    }
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
