import { defaultLanguage } from "/src/i18n/mod.ts";
import type { LanguageSessionData } from "/src/i18n/types.ts";

export const getInitialLanguageSessionData = (): LanguageSessionData => ({
  language: defaultLanguage,
});
