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
 * The note is what ends up in the conversation history, so it names the sender
 * and whether it was a reply: three turns later that is all the model has left
 * to tell one photo from another.
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

  const description = await analyzeTelegramMedia(ctx, attachments, {
    context: [
      attachments.some((attachment) => attachment.fromReply)
        ? "the user is asking the assistant about them"
        : "the user just sent them to the assistant",
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
 */
export const describeDeliveredMedia = async (
  ctx: BotContext,
  messages: Message[],
  command: string,
): Promise<string | undefined> => {
  const attachments = messages.flatMap((message) =>
    collectMessageMedia(message)
  );

  if (attachments.length === 0) {
    return undefined;
  }

  const description = await analyzeTelegramMedia(ctx, attachments, {
    context:
      `the bot itself just posted them by running its /${command} command`,
  });

  return description
    ? formatMediaMemoryNote(
      buildDeliveredMediaHeadline(attachments, command),
      description,
    )
    : undefined;
};
