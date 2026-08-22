import type { Configuration } from "/src/platform/configuration/middlewares/types.ts";

type AssistantRoutingConfiguration = Pick<
  Configuration,
  "assistantAllowedChatIds" | "environment"
>;

export const isAssistantChatAllowed = (
  chatId: number,
  configuration: AssistantRoutingConfiguration,
): boolean => {
  const { assistantAllowedChatIds, environment } = configuration;

  return assistantAllowedChatIds.includes(chatId) ||
    (environment === "development" && assistantAllowedChatIds.length === 0);
};

export const isAssistantMessageAddressedToBot = (
  chatType: string,
  mentionedQuestion: string | undefined,
  replyToBot: boolean,
): boolean =>
  chatType === "private" || mentionedQuestion !== undefined || replyToBot;
