import { assertEquals } from "@std/assert";
import {
  isAssistantChatAllowed,
  isAssistantMessageAddressedToBot,
} from "./routingPolicy.ts";

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
    isAssistantMessageAddressedToBot("private", undefined, false),
    true,
  );
});

Deno.test("group messages still require a mention or reply", () => {
  assertEquals(
    isAssistantMessageAddressedToBot("supergroup", undefined, false),
    false,
  );
  assertEquals(
    isAssistantMessageAddressedToBot("supergroup", "question", false),
    true,
  );
  assertEquals(
    isAssistantMessageAddressedToBot("supergroup", undefined, true),
    true,
  );
});
