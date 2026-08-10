import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import { createTranslator } from "/src/i18n/mod.ts";
import { cmdLanguage } from "./cmdLanguage.ts";

const invokeLanguage = async (match: string, initialLanguage: "en" | "pt") => {
  const replies: string[] = [];
  const session: { language?: "en" | "pt" } = {
    language: initialLanguage,
  };
  const context = {
    language: initialLanguage,
    match,
    reply: (text: string) => {
      replies.push(text);
      return Promise.resolve({ message_id: 1 });
    },
    session,
    t: createTranslator(initialLanguage),
  };

  const command = cmdLanguage as unknown as (
    context: BotContext,
  ) => Promise<unknown>;
  await command(context as unknown as BotContext);

  return { replies, session };
};

Deno.test("changes the chat language using a case-insensitive code", async () => {
  const { replies, session } = await invokeLanguage("PT", "en");

  assertEquals(session.language, "pt");
  assertEquals(replies, ["Idioma alterado para Português."]);
});

Deno.test("reports the current language when no code is provided", async () => {
  const { replies, session } = await invokeLanguage("", "pt");

  assertEquals(session.language, "pt");
  assertEquals(replies, [
    "Idioma atual: Português. Use /language PT ou /language EN para alterá-lo.",
  ]);
});

Deno.test("rejects unsupported languages without changing the session", async () => {
  const { replies, session } = await invokeLanguage("ES", "en");

  assertEquals(session.language, "en");
  assertEquals(replies, [
    "Unsupported language. Use /language PT or /language EN.",
  ]);
});
