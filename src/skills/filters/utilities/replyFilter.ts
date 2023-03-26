import { match, P } from "ts-pattern";
import { BotContext } from "/src/context/mod.ts";
import { Filter } from "grammy/filter.ts";
import { Filter as SessionFilter } from "../sessionData/types.ts";

export const replyFilter = async (
  filter: string,
  ctx: Filter<BotContext, "message:text">,
) => {
  const filterMessage = ctx.session.filters.get(filter)!;
  const reply = getReplyMethod(filterMessage, ctx);

  await reply();
};

const getReplyMethod = (
  filterMessage: SessionFilter,
  ctx: Filter<BotContext, "message:text">,
) => {
  const caption = filterMessage.message.caption;
  return match(filterMessage.message)
    .with({ video: P.not(undefined) }, ({ video }) => async () => {
      await ctx.api.sendChatAction(ctx.chat.id, "upload_video");
      await ctx.replyWithVideo(video.fileId, {
        caption,
      });
    })
    .with({ audio: P.not(undefined) }, ({ audio }) => async () => {
      await ctx.api.sendChatAction(ctx.chat.id, "upload_voice");
      await ctx.replyWithAudio(audio.fileId, {
        caption,
      });
    })
    .with({ image: P.not(undefined) }, ({ image }) => async () => {
      await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
      await ctx.replyWithPhoto(image.fileId, {
        caption,
        reply_to_message_id: ctx.msg.message_id,
      });
    })
    .with({ voice: P.not(undefined) }, ({ voice }) => async () => {
      await ctx.api.sendChatAction(ctx.chat.id, "upload_voice");
      await ctx.replyWithVoice(voice.fileId, {
        caption,
      });
    })
    .with({ sticker: P.not(undefined) }, ({ sticker }) => async () => {
      await ctx.api.sendChatAction(ctx.chat.id, "choose_sticker");
      await ctx.replyWithSticker(sticker.fileId, {
        reply_to_message_id: ctx.msg.message_id,
      });
    })
    .with({ videoNote: P.not(undefined) }, ({ videoNote }) => async () => {
      await ctx.api.sendChatAction(ctx.chat.id, "upload_video_note");
      await ctx.replyWithVideoNote(videoNote.fileId);
    })
    .with({ animation: P.not(undefined) }, ({ animation }) => async () => {
      await ctx.api.sendChatAction(ctx.chat.id, "upload_video_note");
      await ctx.replyWithAnimation(animation.fileId, {
        caption,
      });
    })
    .with({ document: P.not(undefined) }, ({ document }) => async () => {
      await ctx.api.sendChatAction(ctx.chat.id, "upload_document");
      await ctx.replyWithDocument(document.fileId, {
        caption,
        reply_to_message_id: ctx.msg.message_id,
      });
    })
    .otherwise(() => async () => {
      if (!caption) {
        return;
      }

      await ctx.api.sendChatAction(ctx.chat.id, "typing");
      await ctx.reply(caption, {
        reply_to_message_id: ctx.msg.message_id,
      });
    });
};
