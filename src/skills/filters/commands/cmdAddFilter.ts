import { CommandMiddleware } from "grammy/composer.ts";
import { format, relative, resolve } from "std/path/posix.ts";
import { BotContext } from "/src/context/mod.ts";
import { extensionsByType } from "std/media_types/mod.ts";
import { Filter } from "../sessionData/types.ts";

export const cmdAddFilter: CommandMiddleware<BotContext> = async (ctx) => {
  const filterTrigger = ctx.match;

  if (!filterTrigger) {
    return ctx.reply(
      "You should give me a filter to use. Example: `/add_filter !myfilter`",
    );
  }

  const filePath = resolve(
    ctx.configuration.dataPath,
    "./downloads",
  );

  const repliedMessage = ctx.update.message?.reply_to_message;

  if (!repliedMessage) {
    return ctx.reply("You should run this command when replying to a message.");
  }

  const downloadFile = async (fileId: string, mimeType?: string) => {
    const file = await ctx.api.getFile(fileId);

    const downloadFileName = format({
      name: fileId,
      ext: mimeType ? "." + extensionsByType(mimeType)![0] : undefined,
    });

    const downloadedPath = await file.download(
      resolve(filePath, downloadFileName),
    );

    return relative(ctx.configuration.dataPath, downloadedPath);
  };

  const downloadMessage = async () => {
    const messageCaption = repliedMessage.text ?? repliedMessage.caption;
    const messagePhotos = repliedMessage.photo ?? [];
    const messageAudio = repliedMessage.audio;
    const messageVideo = repliedMessage.video;
    const messageSticker = repliedMessage.sticker;
    const messageVoice = repliedMessage.voice;
    const messageVideoNote = repliedMessage.video_note;

    const filterMessage: Filter["message"] = {
      caption: messageCaption,
    };

    if (messageSticker !== undefined) {
      filterMessage.sticker = {
        fileId: messageSticker.file_id,
      };
    }

    if (messageVoice !== undefined) {
      filterMessage.voice = {
        fileId: messageVoice.file_id,
        path: await downloadFile(messageVoice.file_id, messageVoice.mime_type),
      };
    }

    if (messageVideoNote !== undefined) {
      filterMessage.videoNote = {
        fileId: messageVideoNote.file_id,
      };
    }

    if (messageVideo !== undefined) {
      filterMessage.video = {
        path: await downloadFile(messageVideo.file_id, messageVideo.mime_type),
        fileId: messageVideo.file_id,
      };
    }

    if (messageAudio !== undefined) {
      filterMessage.audio = {
        path: await downloadFile(messageAudio.file_id, messageAudio.mime_type),
        fileId: messageAudio.file_id,
      };
    }

    if (messagePhotos.length > 0) {
      /**
       * TODO: support for multiple images at once
       */
      const firstPhoto = messagePhotos[0];
      filterMessage.image = {
        path: await downloadFile(firstPhoto.file_id),
        fileId: firstPhoto.file_id,
      };
    }

    return filterMessage;
  };

  ctx.session.filters.set(filterTrigger, {
    filterTrigger,
    active: true,
    ownerId: ctx.message!.from.id,
    message: await downloadMessage(),
  });

  await ctx.reply("Filter is added");
};
