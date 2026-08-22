import type { Source } from "../httpClients/types.ts";

const URL_PATTERN = /https?:\/\/[^\s)"']+/g;
const MAX_SOURCES = 5;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Extracts source links from a tool result. Prefers structured content shaped
 * like an array of { url, title } items, and falls back to scanning the text
 * for http(s) URLs.
 */
export const extractSources = (input: unknown): Source[] => {
  const sources: Source[] = [];
  const seen = new Set<string>();

  const add = (url: string, title?: string) => {
    if (seen.has(url) || sources.length >= MAX_SOURCES) {
      return;
    }
    seen.add(url);
    sources.push(title ? { url, title } : { url });
  };

  const addFromArray = (items: unknown[]): boolean => {
    for (const item of items) {
      if (isRecord(item)) {
        const url = typeof item.url === "string" ? item.url : undefined;
        if (url) {
          add(
            url,
            typeof item.title === "string" ? item.title : undefined,
          );
        }
      }
    }

    return sources.length > 0;
  };

  if (Array.isArray(input)) {
    if (addFromArray(input)) {
      return sources;
    }
  }

  if (isRecord(input) && Array.isArray(input.results)) {
    if (addFromArray(input.results)) {
      return sources;
    }
  }

  if (typeof input === "string") {
    const arrayStart = input.indexOf("[");
    const arrayEnd = input.lastIndexOf("]");
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      try {
        const parsed: unknown = JSON.parse(
          input.slice(arrayStart, arrayEnd + 1),
        );
        if (Array.isArray(parsed) && addFromArray(parsed)) {
          return sources;
        }
      } catch {
        // Fall back to scanning unstructured text for URLs.
      }
    }

    for (const match of input.match(URL_PATTERN) ?? []) {
      add(match.replace(/[),.;]+$/, ""));
    }
  }

  return sources;
};
