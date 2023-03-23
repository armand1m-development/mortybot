import { BotContext } from "/src/context/mod.ts";
import { Filter } from "grammy/filter.ts";

export const replyFilter = async (
  filter: string,
  ctx: Filter<BotContext, "message:text">,
) => {
  const filterMessage = ctx.session.filters.get(filter)!;
  const caption = filterMessage.message.caption;

  if (filterMessage.message.video) {
    await ctx.api.sendChatAction(ctx.chat.id, "upload_video");
    const { fileId } = filterMessage.message.video;
    await ctx.replyWithVideo(fileId, {
      caption,
    });
    return;
  }

  if (filterMessage.message.audio) {
    await ctx.api.sendChatAction(ctx.chat.id, "upload_voice");
    const { fileId } = filterMessage.message.audio;
    await ctx.replyWithAudio(fileId, {
      caption,
    });
    return;
  }

  if (filterMessage.message.image) {
    await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
    const { fileId } = filterMessage.message.image;
    await ctx.replyWithPhoto(fileId, {
      caption,
    });
    return;
  }

  if (filterMessage.message.voice) {
    await ctx.api.sendChatAction(ctx.chat.id, "upload_voice");
    const { fileId } = filterMessage.message.voice;
    await ctx.replyWithVoice(fileId, {
      caption,
    });
    return;
  }

  if (filterMessage.message.sticker) {
    await ctx.api.sendChatAction(ctx.chat.id, "choose_sticker");
    const { fileId } = filterMessage.message.sticker;
    await ctx.replyWithSticker(fileId);
    return;
  }

  if (filterMessage.message.videoNote) {
    await ctx.api.sendChatAction(ctx.chat.id, "upload_video_note");
    const { fileId } = filterMessage.message.videoNote;
    await ctx.replyWithVideoNote(fileId);
    return;
  }

  if (filterMessage.message.animation) {
    await ctx.api.sendChatAction(ctx.chat.id, "upload_video");
    const { fileId } = filterMessage.message.animation;
    await ctx.replyWithAnimation(fileId, {
      caption,
    });
    return;
  }

  if (filterMessage.message.document) {
    await ctx.api.sendChatAction(ctx.chat.id, "upload_document");
    const { fileId } = filterMessage.message.document;
    await ctx.replyWithDocument(fileId, {
      caption,
    });
    return;
  }

  if (!caption) {
    return;
  }

  await ctx.api.sendChatAction(ctx.chat.id, "typing");
  await ctx.reply(caption);
};
