import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import type { AssistantPreferences, Preference } from "../sessionData/types.ts";
import { createTranslator } from "/src/i18n/mod.ts";
import { cmdForgetPreference } from "./cmdForgetPreference.ts";

const preference = (overrides: Partial<Preference> = {}): Preference => ({
  id: "p1",
  text: "Always use Celsius here.",
  scope: "chat",
  authorId: 100,
  authorName: "Alice",
  createdAt: 1787000000000,
  ...overrides,
});

const invokeForget = async (
  match: string,
  preferences?: AssistantPreferences,
  from: { id: number; first_name?: string } = { id: 100, first_name: "Alice" },
) => {
  const replies: string[] = [];
  const session = preferences ? { assistant: { preferences } } : {};
  const context = {
    match,
    from,
    session,
    reply: (text: string) => {
      replies.push(text);
      return Promise.resolve({ message_id: 1 });
    },
    t: createTranslator("en"),
  };

  const command = cmdForgetPreference as unknown as (
    context: BotContext,
  ) => Promise<unknown>;
  await command(context as unknown as BotContext);

  return { replies, session };
};

Deno.test("anyone may forget a chat-wide preference", async () => {
  const preferences: AssistantPreferences = {
    chat: [preference({ authorId: 200 })],
    users: new Map(),
  };
  const { replies, session } = await invokeForget("p1", preferences, {
    id: 100,
  });

  assertEquals(replies, ["Preference p1 forgotten."]);
  assertEquals(session.assistant?.preferences?.chat, []);
});

Deno.test("a user preference is forgotten by its author alone", async () => {
  const preferences: AssistantPreferences = {
    chat: [],
    users: new Map([
      [
        100,
        [
          preference({ id: "p1", scope: "user", authorId: 100 }),
          preference({
            id: "p2",
            text: "Answer briefly.",
            scope: "user",
            authorId: 100,
          }),
        ],
      ],
    ]),
  };
  const { replies, session } = await invokeForget("p1", preferences, {
    id: 100,
  });

  assertEquals(replies, ["Preference p1 forgotten."]);
  const remaining = session.assistant?.preferences?.users.get(100) ?? [];
  assertEquals(remaining.length, 1);
  assertEquals(remaining[0].id, "p2");
});

Deno.test("nobody else may forget a user preference", async () => {
  const preferences: AssistantPreferences = {
    chat: [],
    users: new Map([[200, [
      preference({ id: "p1", scope: "user", authorId: 200 }),
    ]]]),
  };
  const { replies, session } = await invokeForget("p1", preferences, {
    id: 100,
  });

  assertEquals(replies, [
    "Only the person who stored preference p1 can forget it.",
  ]);
  assertEquals(session.assistant?.preferences?.users.get(200)?.length, 1);
});

Deno.test("an emptied user store disappears from the map", async () => {
  const preferences: AssistantPreferences = {
    chat: [],
    users: new Map([[100, [preference({ scope: "user", authorId: 100 })]]]),
  };
  await invokeForget("p1", preferences, { id: 100 });

  assertEquals(preferences.users.size, 0);
});

Deno.test("forget command reports unknown ids and missing input", async () => {
  const preferences: AssistantPreferences = {
    chat: [preference()],
    users: new Map(),
  };

  const unknown = await invokeForget("p99", preferences);
  assertEquals(unknown.replies, [
    "No preference with id p99 exists in this chat.",
  ]);

  const empty = await invokeForget("");
  assertEquals(empty.replies, [
    "Usage: /forget_preference ID, e.g. /forget_preference p3.",
  ]);
});
