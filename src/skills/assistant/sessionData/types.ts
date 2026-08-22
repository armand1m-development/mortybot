import type { OpenAiMessage } from "../httpClients/types.ts";
import type { Message } from "grammy/types";
import type { PreparedSkillCommandToolCall } from "/src/platform/skillModules/SkillCommandToolRegistry.ts";
import type { AssistantResponseLanguage } from "../utilities/assistantLanguage.ts";

export interface PendingAssistantToolConfirmation {
  id: string;
  requesterId: number;
  chatId: number;
  expiresAt: number;
  call: PreparedSkillCommandToolCall;
  sourceMessage: Message;
  confirmationMessageId?: number;
}

export type AssistantPreferenceScope = "chat" | "user";

export interface Preference {
  /** Short stable handle, e.g. "p3", shown in the system prompt and listings. */
  id: string;
  /** The stored text, trimmed but otherwise verbatim. */
  text: string;
  scope: AssistantPreferenceScope;
  /** Telegram user id of whoever stored it; for "user" scope, who it is about. */
  authorId: number;
  /** Display-name snapshot captured at write time; never rendered in the prompt. */
  authorName: string;
  /** Epoch milliseconds. Date objects do not survive session serialization. */
  createdAt: number;
}

export interface AssistantPreferences {
  chat: Preference[];
  /** Keyed by Telegram user id; the Map round-trips through session JSON. */
  users: Map<number, Preference[]>;
}

export interface AssistantSessionData {
  assistant?: {
    messages: OpenAiMessage[];
    pendingToolConfirmations: Map<
      string,
      PendingAssistantToolConfirmation
    >;
    responseLanguage: AssistantResponseLanguage;
    emojisEnabled: boolean;
    preferences?: AssistantPreferences;
  };
}
