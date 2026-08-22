import type { BotContext } from "/src/context/mod.ts";
import { messageText } from "../httpClients/types.ts";
import type { OpenAiMessage } from "../httpClients/types.ts";
import { createInitialAssistantState } from "../sessionData/getInitialAssistantSessionData.ts";
import { evictHistory } from "./evictHistory.ts";
import { appendMediaNotes } from "../vision/mediaMemory.ts";

/**
 * Writes media notes straight into the stored history.
 *
 * Used by the paths that post pictures outside a model turn — a confirmed
 * write command runs minutes after the answer that proposed it — so what the
 * bot put in the chat is still something the assistant can talk about later.
 */
export const rememberMediaNotes = (
  ctx: BotContext,
  notes: string[],
): void => {
  if (notes.length === 0) {
    return;
  }

  const assistant = ctx.session.assistant ??= createInitialAssistantState();
  const messages = [...assistant.messages];
  const last = messages.at(-1);

  if (last?.role === "assistant") {
    messages[messages.length - 1] = {
      ...last,
      content: appendMediaNotes(messageText(last.content), notes),
    };
  } else {
    const note: OpenAiMessage = {
      role: "assistant",
      content: appendMediaNotes("", notes),
    };
    messages.push(note);
  }

  assistant.messages = evictHistory(messages);
};
