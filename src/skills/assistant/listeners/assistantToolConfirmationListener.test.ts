import { assertEquals } from "@std/assert";
import type { BotContext } from "/src/context/mod.ts";
import type { PendingAssistantToolConfirmation } from "../sessionData/types.ts";
import { ASSISTANT_TOOL_CONFIRM_CALLBACK } from "../utilities/toolConfirmations.ts";
import { assistantToolConfirmationListener } from "./assistantToolConfirmationListener.ts";

const createPending = (): PendingAssistantToolConfirmation => ({
  id: "abc123",
  requesterId: 42,
  chatId: -100,
  expiresAt: Date.now() + 60_000,
  call: {
    name: "bot_language",
    skillName: "language",
    command: "language",
    input: "PT",
    effect: "write",
    description: "Change language",
    deliverToChat: true,
  },
  sourceMessage: {
    message_id: 10,
    date: 0,
    chat: { id: -100, type: "supergroup", title: "Test Group" },
    text: "change the language",
  },
  confirmationMessageId: 20,
});

const createContext = (requesterId: number) => {
  const pending = createPending();
  let executions = 0;
  const callbackAnswers: Array<Record<string, unknown>> = [];
  const edits: string[] = [];
  const ctx = {
    callbackQuery: {
      data: `${ASSISTANT_TOOL_CONFIRM_CALLBACK}${pending.id}`,
      message: { message_id: 20 },
    },
    from: { id: requesterId },
    chat: { id: -100, type: "supergroup" },
    configuration: {
      environment: "development",
      assistantAllowedChatIds: [-100],
    },
    session: {
      assistant: {
        messages: [],
        pendingToolConfirmations: new Map([[pending.id, pending]]),
      },
    },
    t: (key: string) => key,
    answerCallbackQuery: (options: Record<string, unknown>) => {
      callbackAnswers.push(options);
      return Promise.resolve(true);
    },
    api: {
      editMessageText: (_chatId: number, _messageId: number, text: string) => {
        edits.push(text);
        return Promise.resolve(true);
      },
    },
    skillCommandTools: {
      execute: () => {
        executions += 1;
        return Promise.resolve({ text: "done", sources: [] });
      },
    },
  } as unknown as BotContext;
  return {
    ctx,
    pending,
    callbackAnswers,
    edits,
    getExecutions: () => executions,
  };
};

Deno.test("confirmed assistant tool executes once and clears pending state", async () => {
  const state = createContext(42);
  // The exported listener is a MiddlewareFn in practice.
  await (assistantToolConfirmationListener as CallableFunction)(state.ctx);

  assertEquals(state.getExecutions(), 1);
  assertEquals(
    state.ctx.session.assistant?.pendingToolConfirmations.has(state.pending.id),
    false,
  );
  assertEquals(state.callbackAnswers[0], { text: "assistant.tool.running" });
  assertEquals(state.edits, ["assistant.tool.completed"]);

  await (assistantToolConfirmationListener as CallableFunction)(state.ctx);
  assertEquals(state.getExecutions(), 1);
});

Deno.test("another user cannot confirm a pending assistant tool", async () => {
  const state = createContext(7);
  await (assistantToolConfirmationListener as CallableFunction)(state.ctx);

  assertEquals(state.getExecutions(), 0);
  assertEquals(
    state.ctx.session.assistant?.pendingToolConfirmations.has(state.pending.id),
    true,
  );
  assertEquals(state.callbackAnswers[0], {
    text: "assistant.tool.wrongUser",
    show_alert: true,
  });
});
