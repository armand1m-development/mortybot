import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { createInitialAssistantState } from "../sessionData/getInitialAssistantSessionData.ts";

/**
 * Drops the assistant's conversation history for this chat.
 *
 * Settings outlive the context they were configured in: response language,
 * emojis, preferences and any pending tool confirmation all survive, and only
 * the remembered messages are cleared.
 */
export const cmdAssistantClear: CommandMiddleware<BotContext> = (ctx) => {
  const previous = ctx.session.assistant;

  ctx.session.assistant = {
    ...createInitialAssistantState(),
    ...(previous?.responseLanguage !== undefined
      ? { responseLanguage: previous.responseLanguage }
      : {}),
    ...(previous?.emojisEnabled !== undefined
      ? { emojisEnabled: previous.emojisEnabled }
      : {}),
    ...(previous?.preferences ? { preferences: previous.preferences } : {}),
    ...(previous?.pendingToolConfirmations
      ? { pendingToolConfirmations: previous.pendingToolConfirmations }
      : {}),
  };

  return ctx.reply(ctx.t("assistant.contextCleared"));
};
