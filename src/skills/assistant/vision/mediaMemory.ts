import type { MediaAttachment, MediaKind } from "./types.ts";

/**
 * How much of a description survives into the conversation history.
 *
 * Descriptions are re-sent with every later turn, so an unbounded one would
 * quietly eat the history budget and evict real conversation. The vision
 * prompt already asks for brevity; this is the backstop.
 */
export const MEDIA_NOTE_MAX_LENGTH = 700;

const KIND_NOUNS: Record<MediaKind, [singular: string, plural: string]> = {
  photo: ["photo", "photos"],
  video: ["video", "videos"],
  animation: ["GIF", "GIFs"],
  video_note: ["video note", "video notes"],
  sticker: ["sticker", "stickers"],
  document: ["image file", "image files"],
};

/**
 * A single kind on its own reads as a bare noun ("photo", "2 photos") because
 * the headlines around it supply the article. In a list it needs one of its
 * own, or "2 photos and video" comes out.
 */
const countNoun = (
  kind: MediaKind,
  count: number,
  article: boolean,
): string => {
  const [singular, plural] = KIND_NOUNS[kind];
  if (count > 1) {
    return `${count} ${plural}`;
  }
  return article
    ? `${/^[aeiou]/i.test(singular) ? "an" : "a"} ${singular}`
    : singular;
};

const joinParts = (parts: string[]): string =>
  parts.length <= 1
    ? parts.join("")
    : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;

/** Reads a set of attachments as a phrase, e.g. "2 photos and a video". */
export const summarizeAttachments = (
  attachments: MediaAttachment[],
): string => {
  const counts = new Map<MediaKind, number>();
  for (const attachment of attachments) {
    counts.set(attachment.kind, (counts.get(attachment.kind) ?? 0) + 1);
  }

  const kinds = [...counts.entries()];

  return joinParts(
    kinds.map(([kind, count]) => countNoun(kind, count, kinds.length > 1)),
  );
};

const withSender = (attachments: MediaAttachment[]): string => {
  const summary = summarizeAttachments(attachments);
  const sender = attachments.find((attachment) => attachment.sender)?.sender;
  return sender ? `${summary} from ${sender}` : summary;
};

/**
 * Names where the media came from, so a description read three turns later
 * still says whose photo it was and whether the user was replying to it. A
 * list mixing replied-to and freshly sent media names both groups.
 */
export const buildMediaHeadline = (
  attachments: MediaAttachment[],
): string => {
  const replied = attachments.filter((attachment) => attachment.fromReply);
  const sent = attachments.filter((attachment) => !attachment.fromReply);

  if (replied.length > 0 && sent.length > 0) {
    return `The user is replying to ${withSender(replied)} and attached ${
      withSender(sent)
    }`;
  }
  return replied.length > 0
    ? `The user is replying to ${withSender(attachments)}`
    : `Attached ${withSender(attachments)}`;
};

/** Headline for media a bot command posted into the chat itself. */
export const buildDeliveredMediaHeadline = (
  attachments: MediaAttachment[],
  command: string,
): string =>
  `${summarizeAttachments(attachments)} that /${command} posted here`;

const collapseWhitespace = (text: string): string =>
  text.replace(/\s+/g, " ").trim();

/**
 * Renders one description as a single bracketed line.
 *
 * Bracketed rather than free prose so the model reads it as an observation
 * about the chat instead of as something a participant said.
 */
export const formatMediaMemoryNote = (
  headline: string,
  description: string,
  maxLength = MEDIA_NOTE_MAX_LENGTH,
): string => {
  const collapsed = collapseWhitespace(description);
  const trimmed = collapsed.length > maxLength
    ? `${collapsed.slice(0, maxLength).trimEnd()}…`
    : collapsed;

  return trimmed.length > 0
    ? `[${headline}: ${trimmed}]`
    : `[${headline}. It could not be described.]`;
};

/**
 * Folds media notes into the assistant's own turn text for storage.
 *
 * They ride along with the reply rather than becoming messages of their own so
 * the history keeps alternating user and assistant turns, which is the shape
 * eviction cuts on.
 */
export const appendMediaNotes = (
  content: string,
  notes: string[],
): string =>
  notes.length === 0
    ? content
    : [content, ...notes].filter((part) => part.length > 0).join("\n\n");
