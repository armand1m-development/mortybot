import type { MessageEntity } from "grammy/types";
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
  mentioned: boolean,
  replyToBot: boolean,
): boolean => chatType === "private" || mentioned || replyToBot;

/**
 * Returns the command name when the message leads with a slash command the
 * command chain itself will handle, mirroring grammY's `Context.has.command`
 * exactly: the first entity must be a `bot_command` at offset 0 (text entities
 * only — grammY never matches commands in media captions), the name is
 * compared verbatim, and a `@username` suffix must address this bot.
 *
 * The assistant uses this to step aside for messages the command chain owns,
 * so a bare command is not run twice — once by its handler and once more
 * through a bot_ tool.
 */
export const extractLeadingCommandName = (
  text: string | undefined,
  entities: MessageEntity[] | undefined,
  botUsername: string,
): string | undefined => {
  if (!text || !entities || entities.length === 0) {
    return undefined;
  }

  const entity = entities.find((candidate) =>
    candidate.type === "bot_command" && candidate.offset === 0
  );
  if (!entity) {
    return undefined;
  }

  const raw = text.substring(1, entity.length);
  const atIndex = raw.indexOf("@");
  if (atIndex === -1) {
    return raw.length > 0 ? raw : undefined;
  }

  const target = raw.substring(atIndex + 1).toLowerCase();
  if (target !== botUsername.toLowerCase()) {
    return undefined;
  }

  const name = raw.substring(0, atIndex);
  return name.length > 0 ? name : undefined;
};
