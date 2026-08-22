import { assertEquals } from "@std/assert";
import {
  extractLeadingCommandName,
  isAssistantChatAllowed,
  isAssistantMessageAddressedToBot,
} from "./routingPolicy.ts";

const botCommandEntity = (
  offset: number,
  length: number,
): { type: "bot_command"; offset: number; length: number } => ({
  type: "bot_command",
  offset,
  length,
});

Deno.test("empty assistant allowlist permits chats in development", () => {
  assertEquals(
    isAssistantChatAllowed(123, {
      environment: "development",
      assistantAllowedChatIds: [],
    }),
    true,
  );
});

Deno.test("empty assistant allowlist denies chats in production", () => {
  assertEquals(
    isAssistantChatAllowed(123, {
      environment: "production",
      assistantAllowedChatIds: [],
    }),
    false,
  );
});

Deno.test("configured assistant allowlist is enforced in development", () => {
  const configuration = {
    environment: "development" as const,
    assistantAllowedChatIds: [456],
  };

  assertEquals(isAssistantChatAllowed(123, configuration), false);
  assertEquals(isAssistantChatAllowed(456, configuration), true);
});

Deno.test("private messages address the assistant without a mention", () => {
  assertEquals(
    isAssistantMessageAddressedToBot("private", false, false),
    true,
  );
});

Deno.test("group messages still require a mention or reply", () => {
  assertEquals(
    isAssistantMessageAddressedToBot("supergroup", false, false),
    false,
  );
  assertEquals(
    isAssistantMessageAddressedToBot("supergroup", true, false),
    true,
  );
  assertEquals(
    isAssistantMessageAddressedToBot("supergroup", false, true),
    true,
  );
});

Deno.test("leading commands are extracted with or without a bot suffix", () => {
  assertEquals(
    extractLeadingCommandName(
      "/tp_now now",
      [botCommandEntity(0, 7)],
      "MortyBot",
    ),
    "tp_now",
  );
  assertEquals(
    extractLeadingCommandName(
      "/tp_now@MortyBot hi",
      [botCommandEntity(0, 16)],
      "MortyBot",
    ),
    "tp_now",
  );
  assertEquals(
    extractLeadingCommandName(
      "/tp_now@mortybot hi",
      [botCommandEntity(0, 16)],
      "MortyBot",
    ),
    "tp_now",
  );
  // The command name keeps its case: the command chain compares verbatim.
  assertEquals(
    extractLeadingCommandName("/TP_NOW", [botCommandEntity(0, 7)], "MortyBot"),
    "TP_NOW",
  );
});

Deno.test("commands addressed to another bot are not extracted", () => {
  assertEquals(
    extractLeadingCommandName(
      "/tp_now@otherbot hi",
      [botCommandEntity(0, 15)],
      "MortyBot",
    ),
    undefined,
  );
});

Deno.test("commands that do not lead the message are not extracted", () => {
  assertEquals(
    extractLeadingCommandName(
      "run /tp_now please",
      [botCommandEntity(4, 7)],
      "MortyBot",
    ),
    undefined,
  );
  assertEquals(
    extractLeadingCommandName("@MortyBot /tp_now hi", [
      { type: "mention", offset: 0, length: 9 },
      botCommandEntity(10, 7),
    ], "MortyBot"),
    undefined,
  );
  assertEquals(
    extractLeadingCommandName("hello there", [
      { type: "bold", offset: 0, length: 5 },
    ], "MortyBot"),
    undefined,
  );
});

Deno.test("messages without text entities never yield a command", () => {
  // Media captions carry their entities in `caption_entities`, which the
  // command chain never reads — the caller passes `text` entities only.
  assertEquals(
    extractLeadingCommandName(undefined, undefined, "MortyBot"),
    undefined,
  );
  assertEquals(
    extractLeadingCommandName("/tp_now", [], "MortyBot"),
    undefined,
  );
  assertEquals(
    extractLeadingCommandName("/tp_now", undefined, "MortyBot"),
    undefined,
  );
});
