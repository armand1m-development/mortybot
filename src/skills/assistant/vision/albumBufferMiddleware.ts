import type { MiddlewareFn } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { collectMessageMedia } from "./collectMessageMedia.ts";
import { getAlbumBuffer } from "./albumBuffer.ts";

/**
 * Files every album item into the album buffer as its update arrives.
 *
 * Must be registered in bot.ts BEFORE `sequentialize`: an assistant turn that
 * waits out an album (`collectAlbumAttachments`) holds the per-chat chain, so
 * the sibling updates of the same album would otherwise queue behind the very
 * turn that is waiting for them and only be remembered after it finished.
 * Deliberately synchronous, cheap, and never throwing — it runs for every
 * update of every chat, ahead of the error-handled chain.
 */
export const createAlbumBufferMiddleware =
  (): MiddlewareFn<BotContext> => (ctx, next) => {
    const mediaGroupId = ctx.msg?.media_group_id;
    if (mediaGroupId) {
      const media = collectMessageMedia(ctx.msg);
      if (media.length > 0) {
        getAlbumBuffer().remember(mediaGroupId, media);
      }
    }
    return next();
  };
