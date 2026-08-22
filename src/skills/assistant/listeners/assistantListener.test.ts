import {
  assertEquals,
  assertNotStrictEquals,
  assertStrictEquals,
  assertStringIncludes,
} from "@std/assert";
import {
  buildSystemPrompt,
  MAX_CACHED_SYSTEM_PROMPTS,
} from "./assistantListener.ts";

/**
 * The memo cache is module state shared by every test in this file, so each
 * test uses directives no other test touches. Cache identity is observable by
 * comparing the Promises before awaiting them: a hit returns the same Promise,
 * a miss a fresh one.
 */
const directive = (index: number): string =>
  index === 0
    ? ""
    : `## Standing preferences\n\nChat-wide:\n- [p${index}] Rule ${index}.`;

type PromptInputs = Parameters<typeof buildSystemPrompt>;

const inputs = (
  preferencesDirective: string,
): PromptInputs => ["en", false, "auto", true, false, preferencesDirective];

Deno.test("identical inputs return the memoized prompt", async () => {
  const first = buildSystemPrompt(...inputs(directive(9001)));
  const second = buildSystemPrompt(...inputs(directive(9001)));
  await first;
  await second;

  assertStrictEquals(first, second);
});

Deno.test("the preferences directive is rendered verbatim at the end", async () => {
  const prompt = await buildSystemPrompt(...inputs(directive(9002)));

  assertStringIncludes(prompt, directive(9002));
  assertEquals(prompt.endsWith(directive(9002)), true);
});

Deno.test("no preferences leave the prompt without a preferences section", async () => {
  const prompt = await buildSystemPrompt(...inputs(""));

  assertEquals(prompt.includes("## Standing preferences"), false);
  // The language directive is the last remaining dynamic segment.
  assertEquals(prompt.endsWith("Respond in English."), true);
});

Deno.test("directives order language, then emoji, then preferences", async () => {
  const prompt = await buildSystemPrompt(
    ...(["en", false, "auto", false, false, directive(9003)] as PromptInputs),
  );

  const languageAt = prompt.indexOf("Respond in English.");
  const emojiAt = prompt.indexOf("Do not use emojis anywhere");
  const preferencesAt = prompt.indexOf(directive(9003));

  assertEquals(languageAt >= 0 && emojiAt > languageAt, true);
  assertEquals(preferencesAt > emojiAt, true);
});

Deno.test("the prompt cache evicts its least recently used entries", async () => {
  const warm = buildSystemPrompt(...inputs(directive(9100)));
  await warm;

  // Push a full cache worth of distinct prompts through, so everything that
  // existed before — including the warm entry — becomes eviction fodder.
  for (let index = 0; index < MAX_CACHED_SYSTEM_PROMPTS; index += 1) {
    await buildSystemPrompt(...inputs(directive(9200 + index)));
  }

  const latest = directive(9200 + MAX_CACHED_SYSTEM_PROMPTS - 1);

  const reloadedWarm = buildSystemPrompt(...inputs(directive(9100)));
  const stillCachedLatest = buildSystemPrompt(...inputs(latest));
  const stillCachedLatestAgain = buildSystemPrompt(...inputs(latest));
  await Promise.all([reloadedWarm, stillCachedLatest, stillCachedLatestAgain]);

  assertNotStrictEquals(reloadedWarm, warm);
  assertStrictEquals(stillCachedLatest, stillCachedLatestAgain);
});
