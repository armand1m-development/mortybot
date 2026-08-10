import IntlMessageFormat from "intl-messageformat";
import { parse as parseYaml } from "@std/yaml";
import {
  type Language,
  type Translate,
  type TranslationKey,
  translationKeys,
} from "./translations.generated.ts";

export type {
  Language,
  Translate,
  TranslationKey,
} from "./translations.generated.ts";

export const defaultLanguage: Language = "en";

const localeByLanguage: Record<Language, string> = {
  en: "en-US",
  pt: "pt-BR",
};

export const getLanguageLocale = (language: Language) =>
  localeByLanguage[language];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const flattenCatalog = (
  value: Record<string, unknown>,
  prefix = "",
): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === "string") {
      result[path] = child;
    } else if (isRecord(child)) {
      Object.assign(result, flattenCatalog(child, path));
    }
  }

  return result;
};

const loadCatalogs = async () => {
  const yaml = await Deno.readTextFile(
    new URL("./translations.yaml", import.meta.url),
  );
  const document = parseYaml(yaml);
  if (!isRecord(document)) {
    throw new TypeError("The translation catalog must be an object.");
  }

  return Object.fromEntries(
    Object.entries(document).map(([language, catalog]) => {
      if (!isRecord(catalog)) {
        throw new TypeError(`The ${language} catalog must be an object.`);
      }
      return [language, flattenCatalog(catalog)];
    }),
  ) as Record<Language, Record<TranslationKey, string>>;
};

const catalogs = await loadCatalogs();
const formatterCache = new Map<string, IntlMessageFormat>();

for (const language of Object.keys(catalogs) as Language[]) {
  for (const key of translationKeys) {
    if (typeof catalogs[language][key] !== "string") {
      throw new TypeError(`Missing translation "${key}" for ${language}.`);
    }
  }
}

export const isLanguage = (value: unknown): value is Language =>
  value === "en" || value === "pt";

export const parseLanguage = (value: string): Language | undefined => {
  const language = value.trim().toLowerCase().split(/[-_]/)[0];
  return isLanguage(language) ? language : undefined;
};

export const createTranslator = (language: Language): Translate => {
  const translate: Translate = (key, ...values) => {
    const cacheKey = `${language}:${key}`;
    let formatter = formatterCache.get(cacheKey);

    if (!formatter) {
      formatter = new IntlMessageFormat(
        catalogs[language][key],
        localeByLanguage[language],
      );
      formatterCache.set(cacheKey, formatter);
    }

    const result = formatter.format(values[0]);
    return Array.isArray(result) ? result.join("") : String(result);
  };

  return translate;
};
