import type { Message } from "grammy/types";

/** The kinds of Telegram attachment the assistant knows how to look at. */
export type MediaKind =
  | "photo"
  | "video"
  | "animation"
  | "video_note"
  | "sticker"
  | "document";

/**
 * A Telegram attachment the assistant may look at, reduced to the fields the
 * vision pipeline needs. Nothing is downloaded while building one of these, so
 * a message can be inspected without paying for a file transfer.
 */
export interface MediaAttachment {
  kind: MediaKind;
  /** Telegram file id of the media itself, or of the frame for a photo. */
  fileId: string;
  fileSize?: number;
  mimeType?: string;
  /** Video duration in seconds, as reported by Telegram. */
  durationSeconds?: number;
  /** Cover frame, used when the video itself cannot be sampled. */
  thumbnailFileId?: string;
  /** Set when the attachment came from a message the user replied to. */
  fromReply?: boolean;
  /** Who sent the message the attachment came from, for the memory note. */
  sender?: string;
  caption?: string;
  /** Telegram album this attachment belongs to, when it was sent in one. */
  mediaGroupId?: string;
}

/** An image ready to be handed to the vision model. */
export interface VisionImage {
  bytes: Uint8Array;
  mimeType: string;
  /** Short human label, e.g. "photo 2" or "video frame 3 of 4". */
  label: string;
}

/** One analyzed attachment, as it will be remembered. */
export interface MediaDescription {
  kind: MediaKind;
  /** Prose description produced by the vision model. */
  description: string;
  /** How the attachment reached the chat, e.g. "photo from @armand1m". */
  label: string;
}

export type MessageWithMedia = Pick<
  Message,
  | "photo"
  | "video"
  | "animation"
  | "video_note"
  | "sticker"
  | "document"
  | "caption"
  | "media_group_id"
  | "from"
>;
