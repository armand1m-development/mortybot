import { assertEquals, assertStringIncludes } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import type { AssistantPreferences } from "../sessionData/types.ts";
import { createTranslator, type Language } from "/src/i18n/mod.ts";
import { cmdAssistantPreferences } from "./cmdAssistantPreferences.ts";

const preferences = (): AssistantPreferences => ({
  chat: [
    {
      id: "p1",
      text: "Always use Celsius here.",
      scope: "chat",
      authorId: 100,
      authorName: "Alice",
      createdAt: 1787000000000,
    },
  ],
  users: new Map([
    [
      200,
      [{
        id: "p2",
        text: "Address the speaker as Duke.",
        scope: "user",
        authorId: 200,
        authorName: "Bob",
        createdAt: 1787000001000,
      }],
    ],
  ]),
});

const invokeList = async (
  sessionPreferences?: AssistantPreferences,
  uiLanguage: Language = "en",
) => {
  const replies: string[] = [];
  const session = sessionPreferences
    ? { assistant: { preferences: sessionPreferences } }
    : {};
  const context = {
    match: "",
    session,
    reply: (text: string) => {
      replies.push(text);
      return Promise.resolve({ message_id: 1 });
    },
    t: createTranslator(uiLanguage),
  };

  const command = cmdAssistantPreferences as unknown as (
    context: BotContext,
  ) => Promise<unknown>;
  await command(context as unknown as BotContext);

  return replies;
};

Deno.test("preferences command says when nothing is stored", async () => {
  assertEquals(await invokeList(), [
    "There are no standing preferences in this chat yet. Ask me to remember one, or use /remember_preference.",
  ]);
});

Deno.test("preferences command lists both scopes with ids and authors", async () => {
  assertEquals(await invokeList(preferences()), [
    [
      "Standing preferences in this chat:",
      "- [p1] chat: Always use Celsius here. (added by Alice)",
      "- [p2] user: Address the speaker as Duke. (added by Bob)",
    ].join("\n"),
  ]);
});

Deno.test("preferences command lists in Portuguese too", async () => {
  assertEquals(await invokeList(preferences(), "pt"), [
    [
      "Preferências salvas neste chat:",
      "- [p1] chat: Always use Celsius here. (adicionada por Alice)",
      "- [p2] usuário: Address the speaker as Duke. (adicionada por Bob)",
    ].join("\n"),
  ]);
});

Deno.test("preferences command truncates long texts in listings only", async () => {
  const long = {
    ...preferences(),
    chat: [
      {
        id: "p1",
        text: "x".repeat(200),
        scope: "chat" as const,
        authorId: 100,
        authorName: "Alice",
        createdAt: 1787000000000,
      },
    ],
  };

  const [reply] = await invokeList(long);
  const entry = reply?.split("\n")[1] ?? "";
  assertStringIncludes(entry, `${"x".repeat(119)}…`);
  assertEquals(entry.includes("x".repeat(120)), false);
});
