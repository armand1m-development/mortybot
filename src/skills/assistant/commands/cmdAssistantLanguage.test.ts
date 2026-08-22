import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import { createTranslator, type Language } from "/src/i18n/mod.ts";
import type { AssistantResponseLanguage } from "../utilities/assistantLanguage.ts";
import { cmdAssistantLanguage } from "./cmdAssistantLanguage.ts";

const invokeAssistantLanguage = async (
  match: string,
  uiLanguage: Language,
  initialLanguage: AssistantResponseLanguage,
) => {
  const replies: string[] = [];
  const session = {
    assistant: {
      messages: [],
      pendingToolConfirmations: new Map(),
      responseLanguage: initialLanguage,
    },
  };
  const context = {
    match,
    session,
    reply: (text: string) => {
      replies.push(text);
      return Promise.resolve({ message_id: 1 });
    },
    t: createTranslator(uiLanguage),
  };

  const command = cmdAssistantLanguage as unknown as (
    context: BotContext,
  ) => Promise<unknown>;
  await command(context as unknown as BotContext);

  return { replies, session };
};

Deno.test("assistant language command reports the current setting", async () => {
  const { replies } = await invokeAssistantLanguage("", "en", "auto");

  assertEquals(replies, [
    "Assistant response language: chat default. Use /assistant_language AUTO, PT, or EN to change it.",
  ]);
});

Deno.test("assistant language command persists a forced language", async () => {
  const { replies, session } = await invokeAssistantLanguage(
    "PT",
    "en",
    "auto",
  );

  assertEquals(session.assistant.responseLanguage, "pt");
  assertEquals(replies, [
    "Assistant response language changed to Portuguese.",
  ]);
});

Deno.test("assistant language command restores automatic behavior", async () => {
  const { replies, session } = await invokeAssistantLanguage(
    "auto",
    "pt",
    "en",
  );

  assertEquals(session.assistant.responseLanguage, "auto");
  assertEquals(replies, [
    "Idioma de resposta do assistente alterado para padrão do chat.",
  ]);
});

Deno.test("assistant language command rejects unsupported values", async () => {
  const { replies, session } = await invokeAssistantLanguage("ES", "en", "pt");

  assertEquals(session.assistant.responseLanguage, "pt");
  assertEquals(replies, [
    "Unsupported assistant language. Use /assistant_language AUTO, PT, or EN.",
  ]);
});
