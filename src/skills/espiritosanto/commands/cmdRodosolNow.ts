import { getLogger } from "@std/log";
import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";

export const cmdRodosolNow: CommandMiddleware<BotContext> = async (ctx) => {
  try {
    await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");

    const rodosolRoadPicturesUrls = await ctx.rodosolApi
      .fetchRodosolRoadImages();

    await Promise.allSettled(rodosolRoadPicturesUrls.map((url) => {
      return ctx.replyWithPhoto(url);
    }));
  } catch (error) {
    getLogger().error(error);
    return ctx.reply(ctx.t("rodosol.error"));
  }
};
