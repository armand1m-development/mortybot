import type { BotContext } from "/src/context/mod.ts";
import type { Message } from "grammy/types";

const MAX_REPLY_CONTEXT_LENGTH = 1000;

const extractMessageText = (message: Message): string | undefined => {
  const text = message.text ?? message.caption;
  if (!text) {
    return undefined;
  }

  return text.length > MAX_REPLY_CONTEXT_LENGTH
    ? `${text.slice(0, MAX_REPLY_CONTEXT_LENGTH)}…`
    : text;
};

/**
 * Builds a short context snippet describing the message the user is replying
 * to, so the assistant understands what the question refers to. Returns
 * undefined when there is no usable replied-to message.
 */
export const buildReplyContext = (ctx: BotContext): string | undefined => {
  const replied = ctx.msg?.reply_to_message;
  if (!replied) {
    return undefined;
  }

  // The bot's own messages are already part of the conversation history.
  if (replied.from?.is_bot && replied.from.id === ctx.me.id) {
    return undefined;
  }

  const text = extractMessageText(replied);
  if (!text) {
    return undefined;
  }

  const sender = replied.from?.username ?? replied.from?.first_name ??
    "someone";

  return [
    `The user is replying to an earlier message from ${sender} that said:`,
    `"""${text}"""`,
  ].join("\n");
};
