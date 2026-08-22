import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import { createTranslator, type Language } from "/src/i18n/mod.ts";
import { cmdAssistantEmojis } from "./cmdAssistantEmojis.ts";

const invokeAssistantEmojis = async (
  match: string,
  uiLanguage: Language,
  initialValue: boolean,
) => {
  const replies: string[] = [];
  const session = {
    assistant: {
      messages: [],
      pendingToolConfirmations: new Map(),
      responseLanguage: "auto" as const,
      emojisEnabled: initialValue,
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

  const command = cmdAssistantEmojis as unknown as (
    context: BotContext,
  ) => Promise<unknown>;
  await command(context as unknown as BotContext);

  return { replies, session };
};

Deno.test("assistant emoji command reports the current setting", async () => {
  const { replies } = await invokeAssistantEmojis("", "en", true);

  assertEquals(replies, [
    "Emojis in assistant responses are currently enabled. Use /assistant_emojis ON or OFF to change it.",
  ]);
});

Deno.test("assistant emoji command disables emojis", async () => {
  const { replies, session } = await invokeAssistantEmojis("OFF", "en", true);

  assertEquals(session.assistant.emojisEnabled, false);
  assertEquals(replies, [
    "Emojis in assistant responses are now disabled.",
  ]);
});

Deno.test("assistant emoji command enables emojis", async () => {
  const { replies, session } = await invokeAssistantEmojis("on", "pt", false);

  assertEquals(session.assistant.emojisEnabled, true);
  assertEquals(replies, [
    "Os emojis nas respostas do assistente agora estão ativados.",
  ]);
});

Deno.test("assistant emoji command rejects unsupported values", async () => {
  const { replies, session } = await invokeAssistantEmojis(
    "MAYBE",
    "en",
    false,
  );

  assertEquals(session.assistant.emojisEnabled, false);
  assertEquals(replies, [
    "Unsupported emoji setting. Use /assistant_emojis ON or OFF.",
  ]);
});
