import type { BotContext } from "/src/context/mod.ts";
import type { PreparedSkillCommandToolCall } from "/src/platform/skillModules/SkillCommandToolRegistry.ts";
import type { PendingAssistantToolConfirmation } from "../sessionData/types.ts";
import { createInitialAssistantState } from "../sessionData/getInitialAssistantSessionData.ts";

export const ASSISTANT_TOOL_CONFIRMATION_TTL_MS = 5 * 60 * 1000;
export const ASSISTANT_TOOL_CONFIRM_CALLBACK = "assistant_tool:confirm:";
export const ASSISTANT_TOOL_CANCEL_CALLBACK = "assistant_tool:cancel:";

const createConfirmationId = (): string =>
  crypto.randomUUID().replaceAll("-", "").slice(0, 16);

export const pruneExpiredToolConfirmations = (
  ctx: BotContext,
  now = Date.now(),
): void => {
  const pending = ctx.session.assistant?.pendingToolConfirmations;
  if (!pending) return;
  for (const [id, confirmation] of pending) {
    if (confirmation.expiresAt <= now) pending.delete(id);
  }
};

export const createToolConfirmation = (
  ctx: BotContext,
  call: PreparedSkillCommandToolCall,
  now = Date.now(),
): PendingAssistantToolConfirmation => {
  if (!ctx.from || !ctx.chat || !ctx.msg) {
    throw new Error(
      "A Telegram message, chat, and user are required for confirmation.",
    );
  }
  const assistant = ctx.session.assistant ??= createInitialAssistantState();
  assistant.pendingToolConfirmations ??= new Map();
  pruneExpiredToolConfirmations(ctx, now);

  const confirmation: PendingAssistantToolConfirmation = {
    id: createConfirmationId(),
    requesterId: ctx.from.id,
    chatId: ctx.chat.id,
    expiresAt: now + ASSISTANT_TOOL_CONFIRMATION_TTL_MS,
    call,
    sourceMessage: ctx.msg,
  };
  assistant.pendingToolConfirmations.set(
    confirmation.id,
    confirmation,
  );
  return confirmation;
};
