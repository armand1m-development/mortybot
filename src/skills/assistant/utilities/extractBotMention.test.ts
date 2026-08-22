import { assertEquals } from "@std/assert";
import type { MessageEntity } from "grammy/types";
import { extractBotMention } from "./extractBotMention.ts";

const mentionEntity = (offset: number, length: number): MessageEntity => ({
  type: "mention",
  offset,
  length,
});

const textMentionEntity = (
  offset: number,
  length: number,
  username: string,
): MessageEntity => ({
  type: "text_mention",
  offset,
  length,
  user: { id: 1, is_bot: false, first_name: "U", username },
});

Deno.test("a leading mention keeps the question that follows it", () => {
  assertEquals(
    extractBotMention(
      "@MortyBot what is this?",
      [mentionEntity(0, 9)],
      "MortyBot",
    ),
    { question: "what is this?" },
  );
});

Deno.test("a trailing mention keeps the question that precedes it", () => {
  assertEquals(
    extractBotMention(
      "What is this? @MortyBot",
      [mentionEntity(14, 9)],
      "MortyBot",
    ),
    { question: "What is this?" },
  );
});

Deno.test("a mention in the middle keeps the text on both sides", () => {
  assertEquals(
    extractBotMention(
      "Hey @MortyBot what is this?",
      [mentionEntity(4, 9)],
      "MortyBot",
    ),
    { question: "Hey what is this?" },
  );
});

Deno.test("a bare mention is still addressed, with an empty question", () => {
  assertEquals(
    extractBotMention("@MortyBot", [mentionEntity(0, 9)], "MortyBot"),
    { question: "" },
  );
});

Deno.test("whitespace around a removed mention is tidied", () => {
  assertEquals(
    extractBotMention(
      "Hey   @MortyBot   what",
      [mentionEntity(6, 9)],
      "MortyBot",
    ),
    { question: "Hey what" },
  );
});

Deno.test("mentions of other users are ignored", () => {
  assertEquals(
    extractBotMention(
      "@otherperson hello",
      [mentionEntity(0, 12)],
      "MortyBot",
    ),
    undefined,
  );
  assertEquals(
    extractBotMention(
      "hello",
      [textMentionEntity(0, 5, "otherperson")],
      "MortyBot",
    ),
    undefined,
  );
});

Deno.test("a text_mention of the bot is removed like a plain mention", () => {
  assertEquals(
    extractBotMention(
      "What is this? @MortyBot",
      [textMentionEntity(14, 9, "MortyBot")],
      "MortyBot",
    ),
    { question: "What is this?" },
  );
});

Deno.test("mention matching is case-insensitive", () => {
  assertEquals(
    extractBotMention("@mortybot hi", [mentionEntity(0, 9)], "MortyBot"),
    { question: "hi" },
  );
});

Deno.test("messages without entities never mention the bot", () => {
  assertEquals(
    extractBotMention("What is this? @MortyBot", undefined, "MortyBot"),
    undefined,
  );
  assertEquals(extractBotMention("hello", [], "MortyBot"), undefined);
});
