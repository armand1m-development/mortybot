import type { MediaAttachment, MessageWithMedia } from "./types.ts";

/**
 * Telegram's own download ceiling for bots. Anything larger cannot be fetched
 * through the Bot API at all, so it is filtered out before a request is made
 * rather than after it fails.
 */
export const TELEGRAM_MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;

const IMAGE_DOCUMENT_MIME = /^image\/(jpeg|png|webp|gif|bmp|tiff)$/;
const VIDEO_DOCUMENT_MIME = /^video\//;

const senderName = (message: MessageWithMedia): string | undefined =>
  message.from?.username
    ? `@${message.from.username}`
    : message.from?.first_name;

/**
 * Picks the largest photo size Telegram still lets us download.
 *
 * The sizes arrive smallest-first and the largest is normally a few hundred
 * kilobytes, so the ceiling only ever trips on absurd originals.
 */
const largestPhoto = (
  sizes: NonNullable<MessageWithMedia["photo"]>,
): { file_id: string; file_size?: number } | undefined =>
  [...sizes]
    .filter((size) => (size.file_size ?? 0) <= TELEGRAM_MAX_DOWNLOAD_BYTES)
    .sort((left, right) =>
      (left.width * left.height) - (right.width * right.height)
    )
    .at(-1);

/**
 * Reduces a message to the attachments worth looking at.
 *
 * Documents are included only when their MIME type says they are an image or a
 * video: the assistant has nothing useful to say about a spreadsheet, and
 * downloading one to find that out would be pure waste.
 */
export const collectMessageMedia = (
  message: MessageWithMedia | undefined,
  options: { fromReply?: boolean } = {},
): MediaAttachment[] => {
  if (!message) {
    return [];
  }

  const shared = {
    ...(options.fromReply ? { fromReply: true as const } : {}),
    ...(senderName(message) ? { sender: senderName(message) } : {}),
    ...(message.caption ? { caption: message.caption } : {}),
    ...(message.media_group_id ? { mediaGroupId: message.media_group_id } : {}),
  };

  if (message.photo && message.photo.length > 0) {
    const photo = largestPhoto(message.photo);
    return photo
      ? [{
        kind: "photo",
        fileId: photo.file_id,
        ...(photo.file_size ? { fileSize: photo.file_size } : {}),
        ...shared,
      }]
      : [];
  }

  const video = message.video ?? message.animation;
  if (video) {
    return [{
      kind: message.video ? "video" : "animation",
      fileId: video.file_id,
      ...(video.file_size ? { fileSize: video.file_size } : {}),
      ...(video.mime_type ? { mimeType: video.mime_type } : {}),
      ...(video.duration ? { durationSeconds: video.duration } : {}),
      ...(video.thumbnail ? { thumbnailFileId: video.thumbnail.file_id } : {}),
      ...shared,
    }];
  }

  if (message.video_note) {
    const note = message.video_note;
    return [{
      kind: "video_note",
      fileId: note.file_id,
      ...(note.file_size ? { fileSize: note.file_size } : {}),
      ...(note.duration ? { durationSeconds: note.duration } : {}),
      ...(note.thumbnail ? { thumbnailFileId: note.thumbnail.file_id } : {}),
      ...shared,
    }];
  }

  if (message.sticker) {
    const sticker = message.sticker;
    // Animated and video stickers are tiny looping clips; their thumbnail is
    // the only frame that can be decoded without a video pass, and it says
    // everything the assistant needs about a sticker.
    const fileId = sticker.is_animated || sticker.is_video
      ? sticker.thumbnail?.file_id
      : sticker.file_id;
    return fileId
      ? [{
        kind: "sticker",
        fileId,
        ...(sticker.file_size ? { fileSize: sticker.file_size } : {}),
        ...shared,
      }]
      : [];
  }

  if (message.document) {
    const document = message.document;
    const mime = document.mime_type ?? "";
    const isImage = IMAGE_DOCUMENT_MIME.test(mime);
    const isVideo = VIDEO_DOCUMENT_MIME.test(mime);
    if (!isImage && !isVideo) {
      return [];
    }
    return [{
      kind: isVideo ? "video" : "document",
      fileId: document.file_id,
      ...(document.file_size ? { fileSize: document.file_size } : {}),
      ...(mime ? { mimeType: mime } : {}),
      ...(document.thumbnail
        ? { thumbnailFileId: document.thumbnail.file_id }
        : {}),
      ...shared,
    }];
  }

  return [];
};

/** Whether the attachment is small enough for the Bot API to hand over. */
export const isDownloadable = (attachment: MediaAttachment): boolean =>
  (attachment.fileSize ?? 0) <= TELEGRAM_MAX_DOWNLOAD_BYTES;

/** Whether the attachment needs a video pass rather than a plain decode. */
export const isVideoAttachment = (attachment: MediaAttachment): boolean =>
  attachment.kind === "video" || attachment.kind === "animation" ||
  attachment.kind === "video_note" ||
  (attachment.mimeType?.startsWith("video/") ?? false);
