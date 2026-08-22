import type { AssistantPreferences, Preference } from "../sessionData/types.ts";

export const maxPreferencesPerStore = 15;

export const maxPreferenceTextLength = 280;

export const createInitialAssistantPreferences = (): AssistantPreferences => ({
  chat: [],
  users: new Map(),
});

/**
 * Case- and whitespace-insensitive key used only to detect duplicates. The
 * stored text itself is never rewritten, so rendering stays byte-stable.
 */
export const normalizePreferenceText = (text: string): string =>
  text.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * "p" plus one past the highest numeric suffix across both stores. Ids only
 * need to be unique among preferences that exist at the same time — the model
 * can only cite ids currently rendered in its prompt — so reuse after a forget
 * is fine and no counter needs to live in the session.
 */
export const nextPreferenceId = (
  preferences: AssistantPreferences,
): string => {
  let max = 0;
  for (
    const preference of [
      ...preferences.chat,
      ...[...preferences.users.values()].flat(),
    ]
  ) {
    const suffix = Number(preference.id.replace(/^p/, ""));
    if (Number.isInteger(suffix) && suffix > max) {
      max = suffix;
    }
  }
  return `p${max + 1}`;
};

/**
 * Renders standing preferences as the final dynamic section of the system
 * prompt.
 *
 * The output is a cache contract, not just text: the inference server matches
 * on an exact token prefix, so this must be byte-identical whenever the stored
 * preferences are unchanged. Only ids and text are rendered — never author
 * names or timestamps, which would shift the prefix on every turn — and items
 * keep their storage order. Returns an empty string when there is nothing to
 * show, which leaves the prompt for preference-less chats unchanged.
 */
export const buildAssistantPreferencesDirective = (
  chatPreferences: Preference[],
  userPreferences: Preference[],
): string => {
  const sections: string[] = [];

  if (chatPreferences.length > 0) {
    sections.push([
      "Chat-wide:",
      ...chatPreferences.map((preference) =>
        `- [${preference.id}] ${preference.text}`
      ),
    ].join("\n"));
  }

  if (userPreferences.length > 0) {
    sections.push([
      "For the current speaker:",
      ...userPreferences.map((preference) =>
        `- [${preference.id}] ${preference.text}`
      ),
    ].join("\n"));
  }

  if (sections.length === 0) {
    return "";
  }

  return [
    "## Standing preferences",
    "Persisted behavioral requests from people in this chat. Follow every one of them in each reply. The bracketed tag before each item is its id; pass an id to bot_forget_preference to remove it.",
    sections.join("\n\n"),
  ].join("\n\n");
};
