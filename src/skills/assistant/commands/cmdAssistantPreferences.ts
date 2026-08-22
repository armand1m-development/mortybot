import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";

/**
 * Long texts are truncated in listings only; the stored text and the system
 * prompt rendering always keep the full preference.
 */
const LIST_ENTRY_TEXT_LIMIT = 120;

const truncate = (text: string): string =>
  text.length > LIST_ENTRY_TEXT_LIMIT
    ? `${text.slice(0, LIST_ENTRY_TEXT_LIMIT - 1)}…`
    : text;

/**
 * Lists every standing preference in this chat with its id, scope and author,
 * e.g. so a group can audit who asked for what before removing it.
 */
export const cmdAssistantPreferences: CommandMiddleware<BotContext> = (ctx) => {
  const preferences = ctx.session.assistant?.preferences;
  const chat = preferences?.chat ?? [];
  const users = [...(preferences?.users.values() ?? [])].flat();

  if (chat.length === 0 && users.length === 0) {
    return ctx.reply(ctx.t("assistant.preferences.empty"));
  }

  const lines = [
    ctx.t("assistant.preferences.heading"),
    ...chat.map((preference) =>
      ctx.t("assistant.preferences.chatEntry", {
        id: preference.id,
        text: truncate(preference.text),
        author: preference.authorName,
      })
    ),
    ...users.map((preference) =>
      ctx.t("assistant.preferences.userEntry", {
        id: preference.id,
        text: truncate(preference.text),
        author: preference.authorName,
      })
    ),
  ];

  return ctx.reply(lines.join("\n"));
};
