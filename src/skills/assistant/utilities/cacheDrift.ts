import type { OpenAiMessage, OpenAiTool } from "../httpClients/types.ts";

/**
 * Why a turn's prompt was not served from the inference server's prefix cache.
 *
 * SGLang's RadixAttention matches on an exact token prefix, so any byte that
 * moves near the front of the request costs a full prefill. When the reported
 * cache-hit rate is low this tells us which part moved instead of leaving us to
 * guess.
 */
export type CacheMissReason =
  | "cold_start"
  | "system_change"
  | "tools_change"
  | "history_evicted"
  | "unknown";

export interface PromptShape {
  system: string;
  tools: OpenAiTool[];
  history: OpenAiMessage[];
}

interface ChatFingerprint {
  system: string;
  tools: string;
  historyLength: number;
  historyPrefix: string;
}

const DEFAULT_MAX_CHATS = 200;

/**
 * FNV-1a. A non-cryptographic fingerprint is all this needs: it only ever
 * compares two values for the same chat, and it never leaves the process.
 */
export const fingerprint = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const hashHistory = (messages: OpenAiMessage[]): string =>
  fingerprint(JSON.stringify(messages));

export class CacheDriftTracker {
  private readonly chats = new Map<number, ChatFingerprint>();

  constructor(private readonly maxChats: number = DEFAULT_MAX_CHATS) {}

  /**
   * Classifies this turn against the previous one for the same chat, then
   * remembers this turn. Purely an observer — it never touches the request.
   */
  record(chatId: number, prompt: PromptShape): CacheMissReason {
    const previous = this.chats.get(chatId);
    const current: ChatFingerprint = {
      system: fingerprint(prompt.system),
      tools: fingerprint(JSON.stringify(prompt.tools)),
      historyLength: prompt.history.length,
      historyPrefix: hashHistory(prompt.history),
    };

    // Re-insert so the Map's insertion order approximates least-recently-used.
    this.chats.delete(chatId);
    this.chats.set(chatId, current);
    while (this.chats.size > this.maxChats) {
      const oldest = this.chats.keys().next();
      if (oldest.done) {
        break;
      }
      this.chats.delete(oldest.value);
    }

    if (!previous) {
      return "cold_start";
    }
    if (previous.system !== current.system) {
      return "system_change";
    }
    if (previous.tools !== current.tools) {
      return "tools_change";
    }

    // The previous turn's messages should still be an exact prefix of this
    // turn's. When they are not, history was evicted or rewritten and every
    // token after the system prompt has to be prefilled again.
    const stillAPrefix = current.historyLength >= previous.historyLength &&
      hashHistory(prompt.history.slice(0, previous.historyLength)) ===
        previous.historyPrefix;

    return stillAPrefix ? "unknown" : "history_evicted";
  }
}

let instance: CacheDriftTracker | undefined;

export const getCacheDriftTracker = (): CacheDriftTracker =>
  instance ??= new CacheDriftTracker();
