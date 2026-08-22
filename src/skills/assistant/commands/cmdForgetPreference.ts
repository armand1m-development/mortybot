import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";

/**
 * Forgets one standing preference by its id, e.g. `/forget_preference p3`.
 *
 * Chat-wide preferences shape everyone's replies, so anyone may remove them.
 * A user preference belongs to the person it is about, so only its author can
 * forget it.
 */
export const cmdForgetPreference: CommandMiddleware<BotContext> = (ctx) => {
  const from = ctx.from;
  const id = ctx.match.trim();

  if (!from || id.length === 0) {
    return ctx.reply(ctx.t("assistant.preferences.forgetUsage"));
  }

  const preferences = ctx.session.assistant?.preferences;

  if (preferences) {
    const chatIndex = preferences.chat.findIndex((p) => p.id === id);
    if (chatIndex >= 0) {
      preferences.chat.splice(chatIndex, 1);
      return ctx.reply(ctx.t("assistant.preferences.forgotten", { id }));
    }

    for (const [userId, list] of preferences.users) {
      const index = list.findIndex((p) => p.id === id);
      if (index === -1) {
        continue;
      }
      if (list[index].authorId !== from.id) {
        return ctx.reply(ctx.t("assistant.preferences.forbidden", { id }));
      }
      list.splice(index, 1);
      if (list.length === 0) {
        preferences.users.delete(userId);
      }
      return ctx.reply(ctx.t("assistant.preferences.forgotten", { id }));
    }
  }

  return ctx.reply(ctx.t("assistant.preferences.notFound", { id }));
};
