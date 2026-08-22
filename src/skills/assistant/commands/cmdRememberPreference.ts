import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import type {
  AssistantPreferenceScope,
  Preference,
} from "../sessionData/types.ts";
import { createInitialAssistantState } from "../sessionData/getInitialAssistantSessionData.ts";
import {
  createInitialAssistantPreferences,
  maxPreferencesPerStore,
  maxPreferenceTextLength,
  nextPreferenceId,
  normalizePreferenceText,
} from "../utilities/assistantPreferences.ts";

const parseScope = (value: string): AssistantPreferenceScope | undefined => {
  const normalized = value.trim().toLowerCase();
  return normalized === "chat" || normalized === "user"
    ? normalized
    : undefined;
};

/**
 * Stores a standing behavioral preference, e.g.
 * `/remember_preference user call me Duke`.
 *
 * The input is `<scope>|<text>` split on the first separator, because the tool
 * path builds this string from structured arguments and the preference text
 * may itself contain pipes. A "user" preference always binds to whoever runs
 * the command — through the tool path that is the person who pressed Confirm,
 * never a user id the model picked.
 */
export const cmdRememberPreference: CommandMiddleware<BotContext> = (ctx) => {
  const from = ctx.from;
  if (!from) {
    return ctx.reply(ctx.t("assistant.preferences.usage"));
  }

  const [rawScope, ...rest] = ctx.match.split("|");
  const text = rest.join("|").trim();
  const scope = parseScope(rawScope ?? "");

  if (scope === undefined || text.length === 0) {
    return ctx.reply(ctx.t("assistant.preferences.usage"));
  }
  if (text.length > maxPreferenceTextLength) {
    return ctx.reply(
      ctx.t("assistant.preferences.tooLong", {
        count: maxPreferenceTextLength,
      }),
    );
  }

  ctx.session.assistant ??= createInitialAssistantState();
  const preferences = ctx.session.assistant.preferences ??=
    createInitialAssistantPreferences();

  let store: Preference[];
  if (scope === "chat") {
    store = preferences.chat;
  } else {
    store = preferences.users.get(from.id) ?? [];
    if (store.length === 0) {
      preferences.users.set(from.id, store);
    }
  }

  const duplicate = store.find((preference) =>
    normalizePreferenceText(preference.text) === normalizePreferenceText(text)
  );
  if (duplicate) {
    return ctx.reply(
      ctx.t("assistant.preferences.duplicate", { id: duplicate.id }),
    );
  }
  if (store.length >= maxPreferencesPerStore) {
    return ctx.reply(
      ctx.t("assistant.preferences.limit", {
        count: maxPreferencesPerStore,
      }),
    );
  }

  const preference = {
    id: nextPreferenceId(preferences),
    text,
    scope,
    authorId: from.id,
    authorName: from.first_name ?? from.username ?? "someone",
    createdAt: Date.now(),
  };
  store.push(preference);

  return ctx.reply(
    ctx.t("assistant.preferences.stored", {
      id: preference.id,
      text: preference.text,
    }),
  );
};
