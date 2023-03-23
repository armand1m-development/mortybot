import { getLogger } from "std/log/mod.ts";
import { ReplyMessage } from "grammy/types.ts";
import { Filter } from "../sessionData/types.ts";

type DownloadFileFunction = (
  fileId: string,
  mimeType?: string,
) => Promise<string>;

export const downloadMessage = async (
  repliedMessage: ReplyMessage,
  downloadFile: DownloadFileFunction,
) => {
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
