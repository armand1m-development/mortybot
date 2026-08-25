import { assertEquals } from "@std/assert";
import type { Filter } from "../sessionData/types.ts";
import {
  formatFilterMatches,
  fuzzySubstringDistance,
  normalizeFilterText,
  parseFilterQuery,
  searchFilters,
} from "./searchFilters.ts";

const filter = (overrides: Partial<Filter> = {}): Filter => ({
  isLoud: false,
  filterTrigger: "",
  ownerId: 1,
  active: true,
  message: {},
  ...overrides,
});

Deno.test("query parsing splits terms, phrases, and exclusions", () => {
  assertEquals(parseFilterQuery('jassa "tem cerveja" -bolsonaro'), {
    includes: [
      { text: "jassa", phrase: false },
      { text: "tem cerveja", phrase: true },
    ],
    excludes: [{ text: "bolsonaro", phrase: false }],
  });

  // A quoted exclusion keeps its phrase flag, a lone dash is dropped, and a
  // hyphen inside a word does not make it negative.
  assertEquals(parseFilterQuery('-"exato" semi-legal -'), {
    includes: [{ text: "semi-legal", phrase: false }],
    excludes: [{ text: "exato", phrase: true }],
  });
});

Deno.test("normalization folds case and strips diacritics", () => {
  assertEquals(normalizeFilterText("ÇÃO Jassa"), "cao jassa");
});

Deno.test("fuzzy substring finds near misses, not distant noise", () => {
  assertEquals(fuzzySubstringDistance("armandinhotemcerveja", "cerveja"), 0);
  assertEquals(fuzzySubstringDistance("jassa", "jasas"), 1);
  // "mandioca" is far from "jassa" even for the lenient budget.
  assertEquals(
    fuzzySubstringDistance("mandioca", "jassa") >
      Math.max(1, Math.floor("jassa".length / 3)),
    true,
  );
});

Deno.test("search ranks exact trigger hits above fuzzy caption hits", () => {
  const filters = new Map<string, Filter>([
    ["armandinhotemcerveja", filter()],
    ["jassa", filter({ message: { caption: "o jassa chegou" } })],
    ["jasas", filter()],
    ["bolsonarotemcerveja", filter({ message: { caption: "jasssa na area" } })],
  ]);

  const { matches, scanned } = searchFilters(
    filters,
    parseFilterQuery("jassa"),
  );

  assertEquals(scanned, 4);
  assertEquals(matches.map((match) => match.trigger), [
    "jassa",
    "jasas",
    "bolsonarotemcerveja",
  ]);
  // The exact trigger beats every substring or fuzzy hit.
  assertEquals(matches[0].score, 150);
  assertEquals(
    matches[0].score > matches[1].score &&
      matches[1].score > matches[2].score,
    true,
  );
});

Deno.test("search requires every term and honors exclusions", () => {
  const filters = new Map<string, Filter>([
    ["jassatemcerveja", filter()],
    ["jassatempongo", filter()],
    ["bolsonarotemcerveja", filter()],
  ]);

  assertEquals(
    searchFilters(filters, parseFilterQuery("jassa cerveja")).matches.map((
      match,
    ) => match.trigger),
    ["jassatemcerveja"],
  );

  assertEquals(
    searchFilters(filters, parseFilterQuery("cerveja -jassa")).matches.map((
      match,
    ) => match.trigger),
    ["bolsonarotemcerveja"],
  );
});

Deno.test("phrases match verbatim and never fuzzily", () => {
  const filters = new Map<string, Filter>([
    ["jassatemcerveja", filter()],
    [
      "outracoisa",
      filter({ message: { caption: "jassa tem cerveja em casa" } }),
    ],
  ]);

  assertEquals(
    searchFilters(filters, parseFilterQuery('"jassa tem"')).matches.map((
      match,
    ) => match.trigger),
    ["outracoisa"],
  );
  // One character off a phrase is no longer that phrase.
  assertEquals(
    searchFilters(filters, parseFilterQuery('"jassa temm"')).matches.length,
    0,
  );
});

Deno.test("search describes media and keeps inactive filters marked", () => {
  const filters = new Map<string, Filter>([
    ["som", filter({ active: false, message: { voice: { fileId: "a" } } })],
    ["foto", filter({ message: { image: { fileId: "b" } } })],
  ]);

  const { matches } = searchFilters(filters, parseFilterQuery("som foto"));

  assertEquals(matches.length, 0);

  const voiceOnly = searchFilters(filters, parseFilterQuery("som")).matches;
  assertEquals(voiceOnly[0].mediaType, "voice");
  assertEquals(voiceOnly[0].active, false);
});

Deno.test("match formatting stays compact and reports the full count", () => {
  const matches = searchFilters(
    new Map<string, Filter>([
      ["jassa", filter()],
      ["jasssa", filter({ message: { caption: "x".repeat(200) } })],
    ]),
    parseFilterQuery("jassa"),
  ).matches;

  const text = formatFilterMatches(matches, 763, "jassa");

  assertEquals(text.startsWith('Filters matching "jassa" — 2 of 763:'), true);
  assertEquals(text.includes("[150] jassa (text)"), true);
  assertEquals(text.includes("(inactive)") === false, true);
  // The 200-character caption is clipped.
  assertEquals(text.includes("x".repeat(130)), false);
});
