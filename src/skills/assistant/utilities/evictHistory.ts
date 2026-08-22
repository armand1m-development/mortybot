import type { OpenAiMessage } from "../httpClients/types.ts";

/** Token budget for the persisted conversation history. */
export const HISTORY_MAX_TOKENS = 6_000;

/** How much of the budget survives an eviction. */
const HISTORY_TARGET_RATIO = 0.5;

/** The newest exchange is always kept, however large it is. */
const MINIMUM_RETAINED_MESSAGES = 2;

/**
 * Rough token count. Four characters per token is close enough for a budget and
 * costs nothing, which matters because this runs on every turn.
 */
export const estimateTokens = (messages: OpenAiMessage[]): number =>
  messages.reduce(
    (total, message) => total + Math.ceil((message.content?.length ?? 0) / 4),
    0,
  );

/**
 * Trims conversation history in generations rather than one message at a time.
 *
 * A per-turn sliding window looks tidy but is the worst possible shape for a
 * prefix cache: dropping the oldest message on every turn shifts every token
 * after the system prompt, so the whole history is prefilled again on each
 * request, forever. Dropping half the budget at once instead keeps the prefix
 * byte-identical for the many turns between evictions, and pays the
 * invalidation once.
 *
 * Returns the input array unchanged when nothing needs dropping, so callers can
 * detect a no-op with a reference check.
 */
export const evictHistory = (
  messages: OpenAiMessage[],
  maxTokens: number = HISTORY_MAX_TOKENS,
): OpenAiMessage[] => {
  if (
    messages.length <= MINIMUM_RETAINED_MESSAGES ||
    estimateTokens(messages) <= maxTokens
  ) {
    return messages;
  }

  const target = maxTokens * HISTORY_TARGET_RATIO;
  const latest = messages.length - MINIMUM_RETAINED_MESSAGES;

  let start = 0;
  while (
    start < latest && estimateTokens(messages.slice(start)) > target
  ) {
    start += 1;
  }

  // Cut on a user message so the retained history still reads as whole
  // exchanges rather than starting mid-answer.
  while (start < latest && messages[start].role !== "user") {
    start += 1;
  }

  return messages.slice(start);
};
