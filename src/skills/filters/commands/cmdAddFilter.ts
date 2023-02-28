import { getLogger } from "std/log/mod.ts";
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

  const repliedMessage = (ctx.msg ?? ctx.update.message).reply_to_message;

  if (!repliedMessage) {
    getLogger().error("Failed to find reply_to_message");
    getLogger().debug({
      ctxMsg: ctx.msg,
      ctxUpdateMessage: ctx.update.message,
    });
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
    const messageDocument = repliedMessage.document;
    const messageAnimation = repliedMessage.animation;

    const filterMessage: Filter["message"] = {
      caption: messageCaption,
    };

    if (messageVoice !== undefined) {
      let path: string | undefined = undefined;

      try {
        path = await downloadFile(messageVoice.file_id, messageVoice.mime_type);
      } catch (err) {
        getLogger().debug(
          "Failed to download file. This is a best effort non blocking operation.",
        );
        getLogger().error(err);
      }

      filterMessage.voice = {
        path,
        fileId: messageVoice.file_id,
      };
    }

    if (messageVideo !== undefined) {
      let path: string | undefined = undefined;

      try {
        path = await downloadFile(messageVideo.file_id, messageVideo.mime_type);
      } catch (err) {
        getLogger().debug(
          "Failed to download file. This is a best effort non blocking operation.",
        );
        getLogger().error(err);
      }

      filterMessage.video = {
        path,
        fileId: messageVideo.file_id,
      };
    }

    if (messageAudio !== undefined) {
      let path: string | undefined = undefined;

      try {
        path = await downloadFile(messageAudio.file_id, messageAudio.mime_type);
      } catch (err) {
        getLogger().debug(
          "Failed to download file. This is a best effort non blocking operation.",
        );
        getLogger().error(err);
      }

      filterMessage.audio = {
        path,
        fileId: messageAudio.file_id,
      };
    }

    if (messagePhotos.length > 0) {
      const firstPhoto = messagePhotos[0];
      let path: string | undefined = undefined;

      try {
        path = await downloadFile(firstPhoto.file_id);
      } catch (err) {
        getLogger().debug(
          "Failed to download file. This is a best effort non blocking operation.",
        );
        getLogger().error(err);
      }

      filterMessage.image = {
        path,
        fileId: firstPhoto.file_id,
      };
    }

    if (messageAnimation !== undefined) {
      filterMessage.animation = {
        fileId: messageAnimation.file_id,
      };
    }

    if (messageDocument !== undefined) {
      filterMessage.document = {
        fileId: messageDocument.file_id,
      };
    }

    if (messageSticker !== undefined) {
      filterMessage.sticker = {
        fileId: messageSticker.file_id,
      };
    }

    if (messageVideoNote !== undefined) {
      filterMessage.videoNote = {
        fileId: messageVideoNote.file_id,
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
