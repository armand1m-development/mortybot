import {
  assertEquals,
  assertNotMatch,
  assertNotStrictEquals,
} from "@std/assert";
import type { Preference } from "../sessionData/types.ts";
import {
  buildAssistantPreferencesDirective,
  createInitialAssistantPreferences,
  nextPreferenceId,
  normalizePreferenceText,
} from "./assistantPreferences.ts";

const preference = (overrides: Partial<Preference> = {}): Preference => ({
  id: "p1",
  text: "Always use Celsius here.",
  scope: "chat",
  authorId: 100,
  authorName: "Alice",
  createdAt: 1787000000000,
  ...overrides,
});

Deno.test("no preferences render no directive at all", () => {
  assertEquals(buildAssistantPreferencesDirective([], []), "");
});

Deno.test("chat preferences render the chat section alone", () => {
  assertEquals(
    buildAssistantPreferencesDirective([
      preference({ id: "p1", text: "Always use Celsius here." }),
      preference({ id: "p2", text: "No F1 spoilers." }),
    ], []),
    [
      "## Standing preferences",
      "",
      "Persisted behavioral requests from people in this chat. Follow every one of them in each reply. The bracketed tag before each item is its id; pass an id to bot_forget_preference to remove it.",
      "",
      "Chat-wide:",
      "- [p1] Always use Celsius here.",
      "- [p2] No F1 spoilers.",
    ].join("\n"),
  );
});

Deno.test("user preferences render the speaker section alone", () => {
  assertEquals(
    buildAssistantPreferencesDirective([], [
      preference({
        id: "p3",
        text: "Address the speaker as Duke.",
        scope: "user",
      }),
    ]),
    [
      "## Standing preferences",
      "",
      "Persisted behavioral requests from people in this chat. Follow every one of them in each reply. The bracketed tag before each item is its id; pass an id to bot_forget_preference to remove it.",
      "",
      "For the current speaker:",
      "- [p3] Address the speaker as Duke.",
    ].join("\n"),
  );
});

Deno.test("both scopes render chat before user, in storage order", () => {
  assertEquals(
    buildAssistantPreferencesDirective([
      // Deliberately not alphabetical, to prove the builder never sorts.
      preference({ id: "p1", text: "Zebra warnings first." }),
      preference({ id: "p2", text: "Answer briefly." }),
    ], [
      preference({
        id: "p3",
        text: "Address the speaker as Duke.",
        scope: "user",
      }),
    ]),
    [
      "## Standing preferences",
      "",
      "Persisted behavioral requests from people in this chat. Follow every one of them in each reply. The bracketed tag before each item is its id; pass an id to bot_forget_preference to remove it.",
      "",
      "Chat-wide:",
      "- [p1] Zebra warnings first.",
      "- [p2] Answer briefly.",
      "",
      "For the current speaker:",
      "- [p3] Address the speaker as Duke.",
    ].join("\n"),
  );
});

Deno.test("the directive never mentions authors or timestamps", () => {
  const directive = buildAssistantPreferencesDirective(
    [preference({ authorName: "Alice", createdAt: 1787000000000 })],
    [preference({
      id: "p2",
      scope: "user",
      authorName: "Bob",
      createdAt: 1787999999000,
    })],
  );

  assertNotMatch(directive, /Alice/);
  assertNotMatch(directive, /Bob/);
  assertNotMatch(directive, /1787/);
});

Deno.test("normalization is case- and whitespace-insensitive", () => {
  assertEquals(
    normalizePreferenceText("  Always   use  Celsius "),
    "always use celsius",
  );
});

Deno.test("the next id continues past the highest existing one", () => {
  const preferences = createInitialAssistantPreferences();
  assertEquals(nextPreferenceId(preferences), "p1");

  preferences.chat = [
    preference({ id: "p1" }),
    preference({ id: "p2" }),
  ];
  preferences.users.set(200, [preference({ id: "p5", scope: "user" })]);

  assertEquals(nextPreferenceId(preferences), "p6");
});

Deno.test("initial preferences are empty and freshly allocated", () => {
  const first = createInitialAssistantPreferences();
  const second = createInitialAssistantPreferences();

  assertEquals(first.chat, []);
  assertEquals(first.users.size, 0);
  assertNotStrictEquals(first.chat, second.chat);
  assertNotStrictEquals(first.users, second.users);
});
