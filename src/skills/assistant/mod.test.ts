import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import type { SessionData } from "/src/context/mod.ts";
import skillModule from "./mod.ts";

/**
 * The most recent migration is the one under test; asserting on the highest
 * key rather than hardcoding it keeps this file honest when later migrations
 * land.
 */
const latestMigration = skillModule.migrations[
  Math.max(...Object.keys(skillModule.migrations).map(Number))
];

Deno.test("the latest migration backfills preferences for old sessions", () => {
  const after = latestMigration({} as SessionData);

  assert(after.assistant);
  assertEquals(after.assistant.preferences?.chat, []);
  assertEquals(after.assistant.preferences?.users.size, 0);
});

Deno.test("the latest migration keeps existing preferences untouched", () => {
  const preferences = { chat: [], users: new Map() };
  const before = {
    assistant: {
      messages: [{ role: "user", content: "hello" }],
      pendingToolConfirmations: new Map(),
      responseLanguage: "auto",
      emojisEnabled: true,
      preferences,
    },
  } as unknown as SessionData;

  const after = latestMigration(before);

  assertStrictEquals(after.assistant?.preferences, preferences);
  assertEquals(after.assistant.messages.length, 1);
});
