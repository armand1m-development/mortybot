import type { Message } from "grammy/types";
import type { BotContext } from "/src/context/mod.ts";
import { analyzeTelegramMedia } from "./analyzeTelegramMedia.ts";
import { collectMessageMedia } from "./collectMessageMedia.ts";
import {
  buildDeliveredMediaHeadline,
  buildMediaHeadline,
  formatMediaMemoryNote,
} from "./mediaMemory.ts";
import type { MediaAttachment } from "./types.ts";

/**
 * Describes media a user put in the chat, as one bracketed note.
 *
 * The attachments may mix media the user replied to with media they just
 * sent; both are described in the same pass so the per-turn image ceiling
 * holds across all of them. The note is what ends up in the conversation
 * history, so it names the sender and whether it was a reply: three turns
 * later that is all the model has left to tell one photo from another.
 */
export const describeIncomingMedia = async (
  ctx: BotContext,
  attachments: MediaAttachment[],
): Promise<string | undefined> => {
  if (attachments.length === 0) {
    return undefined;
  }

  const captions = attachments
    .map((attachment) => attachment.caption)
    .filter((caption): caption is string => Boolean(caption));

  const hasReplied = attachments.some((attachment) => attachment.fromReply);
  const hasSent = attachments.some((attachment) => !attachment.fromReply);
  const origin = hasReplied && hasSent
    ? "some of them the user is replying to, and some they just sent"
    : hasReplied
    ? "the user is asking the assistant about them"
    : "the user just sent them to the assistant";

  const description = await analyzeTelegramMedia(ctx, attachments, {
    context: [
      origin,
      ...(captions.length > 0 ? [`caption: "${captions[0]}"`] : []),
    ].join("; "),
  });

  return description
    ? formatMediaMemoryNote(buildMediaHeadline(attachments), description)
    : undefined;
};

/**
 * Describes media a bot command posted while the assistant was running it as a
 * tool, so the assistant can answer questions about pictures it caused to
 * appear but never saw.
 *
 * The command's description reaches the describing pass as context, because it
 * is what tells that pass the pictures are road cameras rather than a meme —
 * and so what the note should bother to mention.
 */
export const describeDeliveredMedia = async (
  ctx: BotContext,
  messages: Message[],
  command: string,
  commandDescription?: string,
): Promise<string | undefined> => {
  const attachments = messages.flatMap((message) =>
    collectMessageMedia(message)
  );

  if (attachments.length === 0) {
    return undefined;
  }

  const fetchedAt = new Date();
  const description = await analyzeTelegramMedia(ctx, attachments, {
    context: [
      `the bot itself just posted them by running its /${command} command`,
      ...(commandDescription ? [`that command ${commandDescription}`] : []),
    ].join("; "),
  });

  return description
    ? formatMediaMemoryNote(
      buildDeliveredMediaHeadline(attachments, command, fetchedAt),
      description,
    )
    : undefined;
};
