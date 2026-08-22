import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import type { AssistantPreferences, Preference } from "../sessionData/types.ts";
import { createTranslator, type Language } from "/src/i18n/mod.ts";
import { cmdRememberPreference } from "./cmdRememberPreference.ts";

const preference = (overrides: Partial<Preference> = {}): Preference => ({
  id: "p1",
  text: "Always use Celsius here.",
  scope: "chat",
  authorId: 100,
  authorName: "Alice",
  createdAt: 1787000000000,
  ...overrides,
});

const invokeRemember = async (
  match: string,
  options: {
    from?: { id: number; first_name?: string };
    preferences?: AssistantPreferences;
    uiLanguage?: Language;
  } = {},
) => {
  const replies: string[] = [];
  const session = options.preferences
    ? { assistant: { preferences: options.preferences } }
    : {};
  const context = {
    match,
    from: options.from ?? { id: 100, first_name: "Alice" },
    session,
    reply: (text: string) => {
      replies.push(text);
      return Promise.resolve({ message_id: 1 });
    },
    t: createTranslator(options.uiLanguage ?? "en"),
  };

  const command = cmdRememberPreference as unknown as (
    context: BotContext,
  ) => Promise<unknown>;
  await command(context as unknown as BotContext);

  return { replies, session };
};

Deno.test("remember command stores a chat preference", async () => {
  const { replies, session } = await invokeRemember(
    "chat|always use celsius here.",
  );

  const stored = session.assistant?.preferences?.chat ?? [];
  assertEquals(stored.length, 1);
  assertEquals(stored[0].id, "p1");
  assertEquals(stored[0].text, "always use celsius here.");
  assertEquals(stored[0].scope, "chat");
  assertEquals(stored[0].authorId, 100);
  assertEquals(stored[0].authorName, "Alice");
  assertEquals(typeof stored[0].createdAt, "number");
  assertEquals(replies, [
    "Preference stored as p1: always use celsius here.",
  ]);
});

Deno.test("remember command binds a user preference to the requester", async () => {
  const { replies, session } = await invokeRemember("user|call me Duke");

  assertEquals(session.assistant?.preferences?.chat, []);
  const stored = session.assistant?.preferences?.users.get(100) ?? [];
  assertEquals(stored.length, 1);
  assertEquals(stored[0].scope, "user");
  assertEquals(stored[0].authorId, 100);
  assertEquals(replies, ["Preference stored as p1: call me Duke"]);
});

Deno.test("remember command rejects a duplicate within the same store", async () => {
  const preferences: AssistantPreferences = {
    chat: [preference()],
    users: new Map(),
  };
  const { replies, session } = await invokeRemember(
    "chat|ALWAYS   use Celsius here.",
    { preferences },
  );

  assertEquals(replies, [
    "That preference is already stored as p1.",
  ]);
  assertEquals(session.assistant?.preferences?.chat.length, 1);
});

Deno.test("remember command allows the same text in other stores", async () => {
  const preferences: AssistantPreferences = {
    chat: [preference({ text: "Call me Duke." })],
    users: new Map([[200, [
      preference({ id: "p9", text: "Call me Duke.", scope: "user" }),
    ]]]),
  };
  const { replies, session } = await invokeRemember("user|call me Duke", {
    preferences,
  });

  assertEquals(replies, ["Preference stored as p10: call me Duke"]);
  assertEquals(session.assistant?.preferences?.chat.length, 1);
  assertEquals(session.assistant?.preferences?.users.get(100)?.length, 1);
});

Deno.test("remember command rejects the preference past the store cap", async () => {
  const preferences: AssistantPreferences = {
    chat: Array.from(
      { length: 15 },
      (_, index) =>
        preference({ id: `p${index + 1}`, text: `rule ${index + 1}` }),
    ),
    users: new Map(),
  };
  const { replies, session } = await invokeRemember("chat|one more", {
    preferences,
  });

  assertEquals(replies, [
    "That preference list is full (max 15). Use /forget_preference to make room.",
  ]);
  assertEquals(session.assistant?.preferences?.chat.length, 15);
});

Deno.test("remember command rejects overlong text", async () => {
  const { replies, session } = await invokeRemember(
    `chat|${"a".repeat(281)}`,
  );

  assertEquals(replies, [
    "Preference text is too long; keep it under 280 characters.",
  ]);
  assertEquals(session.assistant, undefined);
});

Deno.test("remember command explains itself on malformed input", async () => {
  const usage =
    "Usage: /remember_preference chat TEXT or /remember_preference user TEXT, e.g. /remember_preference user call me Duke.";

  for (const match of ["group|something", "no separator", "", "chat|"]) {
    const { replies, session } = await invokeRemember(match);
    assertEquals(replies, [usage]);
    assertEquals(session.assistant, undefined);
  }
});

Deno.test("remember command keeps pipes inside the preference text", async () => {
  const { session } = await invokeRemember("user|use | pipes | freely");

  assertEquals(
    session.assistant?.preferences?.users.get(100)?.[0].text,
    "use | pipes | freely",
  );
});
