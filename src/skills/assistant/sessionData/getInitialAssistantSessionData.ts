import type { AssistantSessionData } from "./types.ts";
import { defaultAssistantResponseLanguage } from "../utilities/assistantLanguage.ts";
import { defaultAssistantEmojisEnabled } from "../utilities/assistantEmojis.ts";
import { createInitialAssistantPreferences } from "../utilities/assistantPreferences.ts";

export const createInitialAssistantState = (): NonNullable<
  AssistantSessionData["assistant"]
> => ({
  messages: [],
  pendingToolConfirmations: new Map(),
  responseLanguage: defaultAssistantResponseLanguage,
  emojisEnabled: defaultAssistantEmojisEnabled,
  preferences: createInitialAssistantPreferences(),
});

export const getInitialAssistantSessionData = (): AssistantSessionData => {
  return {
    assistant: createInitialAssistantState(),
  };
};
