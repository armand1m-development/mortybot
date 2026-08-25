import type { Filter } from "../sessionData/types.ts";

/** One search term as written by the caller, before normalization. */
export interface FilterQueryTerm {
  text: string;
  /** Quoted phrases match as an exact substring and never fuzzily. */
  phrase: boolean;
}

export interface ParsedFilterQuery {
  /** Terms that must all match (AND semantics). */
  includes: FilterQueryTerm[];
  /** Terms that must not appear; matched as exact substrings only. */
  excludes: FilterQueryTerm[];
}

/**
 * Parses the filter query language: whitespace-separated terms that must all
 * match, `"quoted phrases"` matched verbatim, and a leading `-` to exclude.
 */
export const parseFilterQuery = (query: string): ParsedFilterQuery => {
  const includes: FilterQueryTerm[] = [];
  const excludes: FilterQueryTerm[] = [];

  for (const match of query.matchAll(/(-?)(?:"([^"]*)"|(\S+))/g)) {
    const negative = match[1] === "-";
    const phrase = match[2] !== undefined;
    const text = (phrase ? match[2] : match[3] ?? "").trim();
    // Punctuation-only tokens (a stray dash, say) carry nothing to match.
    if (!/[\p{L}\p{N}]/u.test(text)) {
      continue;
    }
    (negative ? excludes : includes).push({ text, phrase });
  }

  return { includes, excludes };
};

/**
 * Case-folds and strips diacritics, so "cacao" finds "cação" and "JASSA"
 * finds "jassa".
 */
export const normalizeFilterText = (text: string): string =>
  text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const levenshtein = (left: string, right: string): number => {
  if (left === right) return 0;
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }

  return previous[right.length];
};

/** How far a term of this length may sit from the text it matches. */
const fuzzyDistanceBudget = (term: string): number =>
  Math.max(1, Math.floor(term.length / 3));

/**
 * Approximate substring: the smallest edit distance between the term and any
 * window of the field of a compatible length. This is what lets a typo like
 * "jasas" still land on "jassa" inside a long compound trigger.
 */
export const fuzzySubstringDistance = (
  field: string,
  term: string,
): number => {
  const budget = fuzzyDistanceBudget(term);
  let best = term.length;

  for (
    let length = Math.max(1, term.length - budget);
    length <= Math.min(field.length, term.length + budget);
    length += 1
  ) {
    for (let start = 0; start + length <= field.length; start += 1) {
      const distance = levenshtein(field.slice(start, start + length), term);
      if (distance < best) {
        best = distance;
      }
      if (best === 0) return 0;
    }
  }

  return best;
};

export interface FilterSearchMatch {
  trigger: string;
  /** Sum of the best score each include term earned; higher is better. */
  score: number;
  /** What kind of media the filter replies with. */
  mediaType: string;
  /** The filter's text content, if any, untruncated. */
  caption: string;
  active: boolean;
}

export interface FilterSearchResult {
  /** Best matches first. */
  matches: FilterSearchMatch[];
  /** How many filters were considered, active or not. */
  scanned: number;
}

/** Best-effort description of what the filter replies with. */
export const describeFilterMedia = (message: Filter["message"]): string => {
  if (message.voice) return "voice";
  if (message.audio) return "audio";
  if (message.video) return "video";
  if (message.videoNote) return "video note";
  if (message.image) return "image";
  if (message.animation) return "animation";
  if (message.sticker) return "sticker";
  if (message.document) return "document";
  return "text";
};

/**
 * Best score one term can earn against one filter, or null when the term
 * does not match it at all.
 *
 * Trigger hits outrank caption hits, exact substrings outrank fuzzy ones, and
 * phrases are exact-only by design — quoting is how the caller says "this
 * precise wording, no guessing".
 */
const scoreTermAgainstFilter = (
  term: FilterQueryTerm,
  trigger: string,
  caption: string,
): number | null => {
  const needle = normalizeFilterText(term.text);
  const haystackTrigger = normalizeFilterText(trigger);
  const haystackCaption = normalizeFilterText(caption);

  if (term.phrase) {
    if (haystackTrigger.includes(needle)) return 90;
    if (haystackCaption.includes(needle)) return 50;
    return null;
  }

  if (haystackTrigger === needle) return 150;
  if (haystackTrigger.includes(needle)) return 100;
  if (haystackCaption.includes(needle)) return 60;

  const triggerDistance = fuzzySubstringDistance(haystackTrigger, needle);
  if (triggerDistance <= fuzzyDistanceBudget(needle)) {
    return Math.max(30, 70 - 10 * triggerDistance);
  }

  const captionDistance = fuzzySubstringDistance(haystackCaption, needle);
  if (captionDistance <= fuzzyDistanceBudget(needle)) {
    return Math.max(10, 40 - 10 * captionDistance);
  }

  return null;
};

const isExcluded = (
  excludes: FilterQueryTerm[],
  trigger: string,
  caption: string,
): boolean => {
  const haystackTrigger = normalizeFilterText(trigger);
  const haystackCaption = normalizeFilterText(caption);

  return excludes.some((term) => {
    const needle = normalizeFilterText(term.text);
    return haystackTrigger.includes(needle) ||
      haystackCaption.includes(needle);
  });
};

/**
 * Searches filters with the query language of `parseFilterQuery`: every
 * include term must match (AND), excludes drop a filter outright, and the
 * survivors are ranked by summed per-term scores. Designed to shrink a
 * several-hundred-filter chat down to a handful of candidates for a person —
 * or a model — to inspect.
 */
export const searchFilters = (
  filters: Map<string, Filter> | [string, Filter][],
  query: ParsedFilterQuery,
): FilterSearchResult => {
  const entries = filters instanceof Map ? [...filters.entries()] : filters;
  const matches: FilterSearchMatch[] = [];
  let scanned = 0;

  for (const [trigger, filter] of entries) {
    scanned += 1;
    const caption = filter.message?.caption ?? "";

    if (isExcluded(query.excludes, trigger, caption)) {
      continue;
    }

    let score = 0;
    let everyTermMatched = true;
    for (const term of query.includes) {
      const termScore = scoreTermAgainstFilter(term, trigger, caption);
      if (termScore === null) {
        everyTermMatched = false;
        break;
      }
      score += termScore;
    }

    if (!everyTermMatched) {
      continue;
    }

    matches.push({
      trigger,
      score,
      mediaType: describeFilterMedia(filter.message ?? {}),
      caption,
      active: filter.active,
    });
  }

  matches.sort((left, right) => right.score - left.score);

  return { matches, scanned };
};

/** Results kept per search; enough to inspect, small enough to read. */
export const FILTER_SEARCH_RESULT_LIMIT = 15;

const truncateFilterCaption = (caption: string): string =>
  caption.length > 120 ? `${caption.slice(0, 120)}…` : caption;

/**
 * Renders ranked matches as the compact listing both the chat and the model
 * read: rank, score, trigger, media type, state, and a caption snippet.
 */
export const formatFilterMatches = (
  matches: FilterSearchMatch[],
  scanned: number,
  query: string,
): string => {
  const shown = matches.slice(0, FILTER_SEARCH_RESULT_LIMIT);
  const lines = shown.map((match, index) => {
    const state = match.active ? "" : " (inactive)";
    const caption = match.caption.length > 0
      ? ` — ${truncateFilterCaption(match.caption)}`
      : "";
    return `${
      index + 1
    }. [${match.score}] ${match.trigger} (${match.mediaType})${state}${caption}`;
  });

  if (matches.length > shown.length) {
    lines.push(`(and ${matches.length - shown.length} more)`);
  }

  return `Filters matching "${query}" — ${matches.length} of ${scanned}:\n${
    lines.join("\n")
  }`;
};
