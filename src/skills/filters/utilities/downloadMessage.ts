import { match, P } from "ts-pattern";
import { Message } from "grammy/types.ts";
import { Filter } from "../sessionData/types.ts";

type DownloadFileFunction = (
  fileId: string,
  mimeType?: string,
) => Promise<string | undefined>;

export const downloadMessage = async (
  replyMessage: Message,
  downloadFile: DownloadFileFunction,
) => {
  const filterMessage: Filter["message"] = await match(replyMessage)
    .with({ audio: P.not(undefined) }, async ({ audio }) => ({
      audio: {
        fileId: audio.file_id,
        path: await downloadFile(audio.file_id, audio.mime_type),
      },
    }))
    .with({ video: P.not(undefined) }, async ({ video }) => ({
      video: {
        fileId: video.file_id,
        path: await downloadFile(video.file_id, video.mime_type),
      },
    }))
    .with({ voice: P.not(undefined) }, async ({ voice }) => ({
      voice: {
        fileId: voice.file_id,
        path: await downloadFile(voice.file_id, voice.mime_type),
      },
    }))
    .with({ photo: P.not(undefined) }, async ({ photo: [image] }) => ({
      image: {
        fileId: image.file_id,
        path: await downloadFile(image.file_id),
      },
    }))
    .with({ sticker: P.not(undefined) }, ({ sticker }) => ({
      sticker: {
        fileId: sticker.file_id,
      },
    }))
    .with({ video_note: P.not(undefined) }, ({ video_note }) => ({
      videoNote: {
        fileId: video_note.file_id,
      },
    }))
    .with({ animation: P.not(undefined) }, ({ animation }) => ({
      animation: {
        fileId: animation.file_id,
      },
    }))
    .with({ document: P.not(undefined) }, ({ document }) => ({
      document: {
        fileId: document.file_id,
      },
    }))
    .otherwise(() => ({}));

  // Always try to insert a caption.
  filterMessage.caption = replyMessage.text ?? replyMessage.caption;
  filterMessage.captionEntities = replyMessage.entities ??
    replyMessage.caption_entities;

  return filterMessage;
};
