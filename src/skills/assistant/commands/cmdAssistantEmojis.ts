import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { createInitialAssistantState } from "../sessionData/getInitialAssistantSessionData.ts";
import {
  defaultAssistantEmojisEnabled,
  parseAssistantEmojisEnabled,
} from "../utilities/assistantEmojis.ts";

export const cmdAssistantEmojis: CommandMiddleware<BotContext> = (ctx) => {
  const current = ctx.session.assistant?.emojisEnabled ??
    defaultAssistantEmojisEnabled;

  if (!ctx.match.trim()) {
    return ctx.reply(ctx.t("assistant.emojis.current", {
      enabled: String(current),
    }));
  }

  const enabled = parseAssistantEmojisEnabled(ctx.match);
  if (enabled === undefined) {
    return ctx.reply(ctx.t("assistant.emojis.unsupported"));
  }

  ctx.session.assistant ??= createInitialAssistantState();
  ctx.session.assistant.emojisEnabled = enabled;

  return ctx.reply(ctx.t("assistant.emojis.changed", {
    enabled: String(enabled),
  }));
};
