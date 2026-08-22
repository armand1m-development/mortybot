import { assertEquals } from "@std/assert";
import {
  createInitialAssistantState,
  getInitialAssistantSessionData,
} from "./getInitialAssistantSessionData.ts";

Deno.test("initial assistant state includes empty preference stores", () => {
  const state = createInitialAssistantState();

  assertEquals(state.messages, []);
  assertEquals(state.preferences?.chat, []);
  assertEquals(state.preferences?.users.size, 0);
});

Deno.test("initial session data wraps the assistant state", () => {
  const sessionData = getInitialAssistantSessionData();

  assertEquals(sessionData.assistant?.preferences?.chat, []);
  assertEquals(sessionData.assistant?.preferences?.users.size, 0);
});
