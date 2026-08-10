import type { Language, Translate } from "./mod.ts";

export interface LanguageSessionData {
  language?: Language;
}

export interface I18nContext {
  language: Language;
  t: Translate;
}
