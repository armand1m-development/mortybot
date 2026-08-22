import type { Message } from "grammy/types";
import type { BotContext } from "/src/context/mod.ts";

type BotApi = BotContext["api"];

/**
 * The Bot API calls that put something visual in the chat.
 *
 * Captured by name rather than by inspecting payloads because the payload is
 * whatever the command chose to upload — a stream, a path, a file id — while
 * the message Telegram returns always carries a downloadable file id.
 */
const MEDIA_METHODS = new Set([
  "sendPhoto",
  "sendMediaGroup",
  "sendVideo",
  "sendAnimation",
  "sendVideoNote",
  "sendDocument",
  "sendSticker",
]);

export interface SentMediaCollector {
  /** Messages the wrapped API posted, in the order Telegram accepted them. */
  readonly messages: Message[];
  wrap(api: BotApi): BotApi;
}

/**
 * Records the media a skill command posts while the assistant runs it as a
 * tool.
 *
 * Wrapping the API rather than the upload payload means the command is written
 * exactly as it would be for a slash invocation, and the assistant still gets
 * a file id it can download and look at afterwards.
 */
export const createSentMediaCollector = (): SentMediaCollector => {
  const messages: Message[] = [];

  return {
    messages,
    wrap: (api) =>
      new Proxy(api, {
        get(target, property, receiver) {
          const value = Reflect.get(target, property, receiver);

          if (
            typeof property !== "string" || typeof value !== "function" ||
            !MEDIA_METHODS.has(property)
          ) {
            return value;
          }

          return async (...args: unknown[]) => {
            const result = await (value as (
              ...args: unknown[]
            ) => Promise<Message | Message[]>).apply(target, args);

            if (Array.isArray(result)) {
              messages.push(...result);
            } else if (result) {
              messages.push(result);
            }

            return result;
          };
        },
      }),
  };
};
