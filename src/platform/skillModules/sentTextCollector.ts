import type { Message } from "grammy/types";
import type { BotContext } from "/src/context/mod.ts";

type BotApi = BotContext["api"];

export interface SentTextCollector {
  /** Texts the wrapped API would have posted, in command order. */
  readonly texts: string[];
  wrap(api: BotApi): BotApi;
}

/**
 * Captures the text a skill command posts while the assistant runs it as a
 * tool in data mode: `sendMessage` never reaches Telegram, its text is
 * recorded instead, and the command receives a stub message so it proceeds
 * exactly as it would on a real send.
 *
 * The mirror image of sentMediaCollector, which observes media that really is
 * delivered; everything other than `sendMessage` passes straight through, so a
 * command that mixes text with media still posts its media.
 */
export const createSentTextCollector = (): SentTextCollector => {
  const texts: string[] = [];

  return {
    texts,
    wrap: (api) =>
      new Proxy(api, {
        get(target, property, receiver) {
          const value = Reflect.get(target, property, receiver);

          if (property !== "sendMessage" || typeof value !== "function") {
            return value;
          }

          return (...args: unknown[]) => {
            texts.push(String(args[1] ?? ""));
            return Promise.resolve({ message_id: -1 } as Message);
          };
        },
      }),
  };
};

/**
 * Records the text a skill command posts while still delivering it — the
 * mirror of `createSentTextCollector`, which suppresses delivery for data
 * mode.
 *
 * Delivery mode uses this so that a command which replies with an error
 * message reaches the model as what actually happened, instead of the
 * unconditional success claim it would otherwise get.
 */
export const createSentTextObserver = (): SentTextCollector => {
  const texts: string[] = [];

  return {
    texts,
    wrap: (api) =>
      new Proxy(api, {
        get(target, property, receiver) {
          const value = Reflect.get(target, property, receiver);

          if (property !== "sendMessage" || typeof value !== "function") {
            return value;
          }

          return async (...args: unknown[]) => {
            const sent = await (value as (
              ...sendArgs: unknown[]
            ) => Promise<Message>).apply(target, args);
            texts.push(String(args[1] ?? ""));
            return sent;
          };
        },
      }),
  };
};
