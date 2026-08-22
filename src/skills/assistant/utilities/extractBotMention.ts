import type { MessageEntity } from "grammy/types";

/**
 * Finds a mention of the bot in the message and returns the text that follows
 * it (the question). Returns undefined when the bot is not mentioned or when
 * there is no text after the mention.
 */
export const extractBotMention = (
  text: string,
  entities: MessageEntity[] | undefined,
  botUsername: string,
): string | undefined => {
  if (!entities || entities.length === 0) {
    return undefined;
  }

  const target = `@${botUsername}`.toLowerCase();

  for (const entity of entities) {
    let isBotMention = false;

    if (entity.type === "mention") {
      const mentioned = text.slice(
        entity.offset,
        entity.offset + entity.length,
      );
      isBotMention = mentioned.toLowerCase() === target;
    } else if (entity.type === "text_mention") {
      isBotMention =
        entity.user?.username?.toLowerCase() === botUsername.toLowerCase();
    }

    if (!isBotMention) {
      continue;
    }

    const question = text.slice(entity.offset + entity.length).trim();
    return question.length > 0 ? question : undefined;
  }

  return undefined;
};
