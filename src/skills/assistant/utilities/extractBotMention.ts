import type { MessageEntity } from "grammy/types";

export interface BotMention {
  /**
   * The message text with the bot's mention removed and the surrounding
   * whitespace tidied to single spaces. May be empty when the mention was the
   * whole message — only the presence of the BotMention says the bot was
   * addressed, never the emptiness of the question.
   */
  question: string;
}

/**
 * Finds the first mention of the bot in the message and returns the text
 * around it with the mention removed. Returns undefined when the bot is not
 * mentioned at all.
 *
 * Only the first bot mention is removed: entities after it would need their
 * offsets shifted, and a message mentioning the bot twice is rare enough to
 * keep the second mention as ordinary text. Telegram entity offsets and
 * lengths are UTF-16 code units, so String.slice cuts exactly at entity
 * boundaries.
 */
export const extractBotMention = (
  text: string,
  entities: MessageEntity[] | undefined,
  botUsername: string,
): BotMention | undefined => {
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

    const before = text.slice(0, entity.offset).trim();
    const after = text.slice(entity.offset + entity.length).trim();
    return {
      question: [before, after]
        .filter((part) => part.length > 0)
        .join(" "),
    };
  }

  return undefined;
};
