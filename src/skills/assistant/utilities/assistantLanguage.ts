import type { Language } from "/src/i18n/mod.ts";

export type AssistantResponseLanguage = Language | "auto";

export const defaultAssistantResponseLanguage: AssistantResponseLanguage =
  "auto";

export const parseAssistantResponseLanguage = (
  value: string,
): AssistantResponseLanguage | undefined => {
  const normalized = value.trim().toLowerCase();
  return normalized === "auto" || normalized === "en" || normalized === "pt"
    ? normalized
    : undefined;
};

export const buildAssistantLanguageDirective = (
  responseLanguage: AssistantResponseLanguage,
  chatLanguage: Language,
): string => {
  const language = responseLanguage === "auto"
    ? chatLanguage
    : responseLanguage;
  const name = language === "pt" ? "Brazilian Portuguese" : "English";

  if (responseLanguage === "auto") {
    return `Respond in ${name}.`;
  }

  return `You MUST respond in ${name}, regardless of the language used by the user or in quoted messages. Do not switch response languages unless the /assistant_language setting is changed.`;
};
