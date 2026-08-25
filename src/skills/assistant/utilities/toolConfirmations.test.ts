import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import type { PreparedSkillCommandToolCall } from "/src/platform/skillModules/SkillCommandToolRegistry.ts";
import {
  ASSISTANT_TOOL_CONFIRMATION_TTL_MS,
  createToolConfirmation,
  pruneExpiredToolConfirmations,
} from "./toolConfirmations.ts";

const call: PreparedSkillCommandToolCall = {
  name: "bot_language",
  skillName: "language",
  command: "language",
  input: "PT",
  effect: "write",
  description: "Change language",
  deliverToChat: true,
};

Deno.test("tool confirmations bind the pending write to user, chat, and source message", () => {
  const sourceMessage = {
    message_id: 10,
    date: 0,
    chat: { id: -100, type: "supergroup" as const, title: "Test Group" },
    text: "speak Portuguese",
  };
  const ctx = {
    from: { id: 42 },
    chat: { id: -100, type: "supergroup" },
    msg: sourceMessage,
    session: {
      assistant: { messages: [], pendingToolConfirmations: new Map() },
    },
  } as unknown as BotContext;

  const pending = createToolConfirmation(ctx, call, 1_000);
  assertEquals(pending.requesterId, 42);
  assertEquals(pending.chatId, -100);
  assertEquals(pending.sourceMessage, sourceMessage);
  assertEquals(pending.expiresAt, 1_000 + ASSISTANT_TOOL_CONFIRMATION_TTL_MS);
  assertEquals(
    ctx.session.assistant?.pendingToolConfirmations.get(pending.id),
    pending,
  );

  pruneExpiredToolConfirmations(
    ctx,
    1_001 + ASSISTANT_TOOL_CONFIRMATION_TTL_MS,
  );
  assertEquals(ctx.session.assistant?.pendingToolConfirmations.size, 0);
});
