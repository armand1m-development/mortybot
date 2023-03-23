import { getLogger } from "std/log/mod.ts";
import { Middleware } from "grammy/composer.ts";
import { Filter } from "grammy/filter.ts";
import { intersect } from "/src/utilities/set/intersect.ts";
import { BotContext } from "/src/context/mod.ts";

const logger = () => getLogger();

export const filterListener: Middleware<Filter<BotContext, "message:text">> = (
  ctx,
) => {
  const text: string = ctx.msg.text;
  const words = new Set(text.split(" "));

  const filterEntries = Object.fromEntries(ctx.session.filters);
  const filterTriggers = new Set(Object.keys(filterEntries));

  const isActive = (trigger: string) => {
    const filterMessage = ctx.session.filters.get(trigger)!;
    return filterMessage.active;
  };

  const isLoud = (trigger: string) => {
    const filterMessage = ctx.session.filters.get(trigger)!;
    return filterMessage.isLoud === true;
  };

  const intersection = intersect(words, filterTriggers)
    .filter((trigger) => isActive(trigger) && !isLoud(trigger));

  const commandsFoundInText = [...filterTriggers].filter((trigger) =>
    isActive(trigger) && isLoud(trigger) && text.includes(trigger)
  );

  logger().debug({
    user: ctx.msg.from,
    text,
    words,
    filterTriggers,
    intersection,
  });

  const matches = new Set([
    ...intersection,
    ...commandsFoundInText,
  ]);

  if (matches.size > 0) {
    matches.forEach(async (match) => {
      const filterMessage = ctx.session.filters.get(match)!;
      const caption = filterMessage.message.caption;

      if (filterMessage.message.video) {
        await ctx.api.sendChatAction(ctx.chat.id, "upload_video");
        const { fileId } = filterMessage.message.video;
        await ctx.replyWithVideo(fileId, {
          caption,
          reply_to_message_id: ctx.msg.message_id,
        });
        return;
      }

      if (filterMessage.message.audio) {
        await ctx.api.sendChatAction(ctx.chat.id, "upload_voice");
        const { fileId } = filterMessage.message.audio;
        await ctx.replyWithAudio(fileId, {
          caption,
          reply_to_message_id: ctx.msg.message_id,
        });
        return;
      }

      if (filterMessage.message.image) {
        await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
        const { fileId } = filterMessage.message.image;
        await ctx.replyWithPhoto(fileId, {
          caption,
          reply_to_message_id: ctx.msg.message_id,
        });
        return;
      }

      if (filterMessage.message.voice) {
        await ctx.api.sendChatAction(ctx.chat.id, "upload_voice");
        const { fileId } = filterMessage.message.voice;
        await ctx.replyWithVoice(fileId, {
          caption,
          reply_to_message_id: ctx.msg.message_id,
        });
        return;
      }

      if (filterMessage.message.sticker) {
        await ctx.api.sendChatAction(ctx.chat.id, "choose_sticker");
        const { fileId } = filterMessage.message.sticker;
        await ctx.replyWithSticker(fileId, {
          reply_to_message_id: ctx.msg.message_id,
        });
        return;
      }

      if (filterMessage.message.videoNote) {
        await ctx.api.sendChatAction(ctx.chat.id, "upload_video_note");
        const { fileId } = filterMessage.message.videoNote;
        await ctx.replyWithVideoNote(fileId, {
          reply_to_message_id: ctx.msg.message_id,
        });
        return;
      }

      if (filterMessage.message.animation) {
        await ctx.api.sendChatAction(ctx.chat.id, "upload_video");
        const { fileId } = filterMessage.message.animation;
        await ctx.replyWithAnimation(fileId, {
          caption,
          reply_to_message_id: ctx.msg.message_id,
        });
        return;
      }

      if (filterMessage.message.document) {
        await ctx.api.sendChatAction(ctx.chat.id, "upload_document");
        const { fileId } = filterMessage.message.document;
        await ctx.replyWithDocument(fileId, {
          caption,
          reply_to_message_id: ctx.msg.message_id,
        });
        return;
      }

      if (!caption) {
        return;
      }

      await ctx.api.sendChatAction(ctx.chat.id, "typing");
      await ctx.reply(caption, {
        reply_to_message_id: ctx.msg.message_id,
      });
    });
  }
};
