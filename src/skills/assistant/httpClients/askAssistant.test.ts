import { assertEquals, assertRejects } from "@std/assert";
import { askAssistant } from "./askAssistant.ts";
import type { ChatCompletionResult } from "./chatCompletion.ts";
import { messageText } from "./types.ts";
import type { OpenAiMessage } from "./types.ts";
import type { AssistantTrajectoryEventData } from "../trajectory/types.ts";

/** Wraps a bare message in the `{ message, usage }` shape the client returns. */
const modelReply = (
  message: OpenAiMessage,
  usage?: ChatCompletionResult["usage"],
): Promise<ChatCompletionResult> =>
  Promise.resolve({ message, ...(usage ? { usage } : {}) });

Deno.test("askAssistant keeps tool schemas but forbids calls past the limit", async () => {
  const suppliedToolCounts: number[] = [];
  const suppliedToolChoices: (string | undefined)[] = [];
  const conversationLengths: number[] = [];
  let completionCount = 0;
  let toolCallCount = 0;

  const result = await askAssistant({
    token: "test-token",
    baseUrl: "http://unused",
    model: "test-model",
    messages: [{ role: "user", content: "Search for Morty" }],
    tools: [{
      type: "function",
      function: {
        name: "search_web",
        description: "Searches the web.",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      },
    }],
    maxToolIterations: 1,
    callTool: (_name, args) => {
      toolCallCount += 1;
      assertEquals(args, { query: "Morty" });
      return Promise.resolve({
        text: "Morty result",
        sources: [{ url: "https://example.com", title: "Example" }],
      });
    },
    completion: (params) => {
      suppliedToolCounts.push(params.tools?.length ?? 0);
      suppliedToolChoices.push(params.toolChoice);
      conversationLengths.push(params.messages.length);
      completionCount += 1;

      if (completionCount === 1) {
        return modelReply({
          role: "assistant",
          content: "",
          tool_calls: [{
            id: "call-1",
            type: "function",
            function: {
              name: "search_web",
              arguments: '{"query":"Morty"}',
            },
          }],
        });
      }

      return modelReply({
        role: "assistant",
        content: "Morty found it.",
      });
    },
  });

  const { toolInvocations, ...summary } = result;
  assertEquals(summary, {
    content: "Morty found it.",
    sources: [{ url: "https://example.com", title: "Example" }],
  });
  assertEquals(toolInvocations.map(({ name }) => name), ["search_web"]);
  assertEquals(toolCallCount, 1);
  // The tool array is identical on both calls so the prompt prefix stays
  // cacheable; only `tool_choice` changes once the budget is spent.
  assertEquals(suppliedToolCounts, [1, 1]);
  assertEquals(suppliedToolChoices, [undefined, "none"]);
  assertEquals(conversationLengths, [1, 4]);
});

Deno.test("askAssistant reports direct delivery and pending confirmation metadata", async () => {
  let completionCount = 0;
  const result = await askAssistant({
    token: "test-token",
    baseUrl: "http://unused",
    model: "test-model",
    messages: [{ role: "user", content: "Change the language" }],
    tools: [{
      type: "function",
      function: {
        name: "bot_language",
        parameters: { type: "object", properties: {} },
      },
    }],
    callTool: () =>
      Promise.resolve({
        text: "Approval required",
        sources: [],
        deliveredToChat: true,
        confirmationId: "pending-1",
      }),
    completion: () => {
      completionCount += 1;
      return modelReply(
        completionCount === 1
          ? {
            role: "assistant",
            tool_calls: [{
              id: "call-1",
              type: "function",
              function: { name: "bot_language", arguments: "{}" },
            }],
          }
          : { role: "assistant", content: "Please confirm." },
      );
    },
  });

  const { toolInvocations, ...summary } = result;
  assertEquals(summary, {
    content: "Please confirm.",
    sources: [],
    deliveredToChat: true,
    confirmationId: "pending-1",
  });
  assertEquals(toolInvocations.map(({ name }) => name), ["bot_language"]);
});

Deno.test("askAssistant applies the duration limit to the whole tool-assisted turn", async () => {
  let completionCount = 0;

  await assertRejects(
    () =>
      askAssistant({
        token: "test-token",
        baseUrl: "http://unused",
        model: "test-model",
        messages: [{ role: "user", content: "Search slowly" }],
        maxDurationMs: 10,
        callTool: async () => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          return { text: "Late result", sources: [] };
        },
        completion: () => {
          completionCount += 1;
          return modelReply({
            role: "assistant",
            tool_calls: [{
              id: "call-1",
              type: "function",
              function: { name: "slow_tool", arguments: "{}" },
            }],
          });
        },
      }),
    Error,
    "Assistant request exceeded maximum duration.",
  );

  assertEquals(completionCount, 1);
});

Deno.test("askAssistant exposes the complete model and tool trajectory", async () => {
  const events: AssistantTrajectoryEventData[] = [];
  let completionCount = 0;

  await askAssistant({
    token: "test-token",
    baseUrl: "http://unused",
    model: "test-model",
    messages: [{ role: "user", content: "Look it up" }],
    tools: [{
      type: "function",
      function: {
        name: "search_web",
        parameters: { type: "object", properties: {} },
      },
    }],
    callTool: (_name, args) => {
      assertEquals(args, { query: "Morty" });
      return Promise.resolve({
        text: "A tool result",
        sources: [{ url: "https://example.com" }],
      });
    },
    completion: () => {
      completionCount += 1;
      return modelReply(
        completionCount === 1
          ? {
            role: "assistant",
            content: "",
            tool_calls: [{
              id: "call-1",
              type: "function",
              function: {
                name: "search_web",
                arguments: '{"query":"Morty"}',
              },
            }],
          }
          : { role: "assistant", content: "The final answer" },
      );
    },
    onTrajectoryEvent: (event) => {
      events.push(event);
    },
  });

  assertEquals(events.map((event) => event.type), [
    "model_request",
    "model_response",
    "tool_call_started",
    "tool_call_completed",
    "model_request",
    "model_response",
    "final_response",
  ]);
  assertEquals(events[0], {
    type: "model_request",
    iteration: 1,
    messages: [{ role: "user", content: "Look it up" }],
    tools: [{
      type: "function",
      function: {
        name: "search_web",
        parameters: { type: "object", properties: {} },
      },
    }],
  });
  assertEquals(events[2], {
    type: "tool_call_started",
    iteration: 1,
    toolCallId: "call-1",
    name: "search_web",
    rawArguments: '{"query":"Morty"}',
    arguments: { query: "Morty" },
  });
  assertEquals(events[4].type, "model_request");
  if (events[4].type === "model_request") {
    assertEquals(events[4].iteration, 2);
    assertEquals(events[4].messages.at(-1), {
      role: "tool",
      tool_call_id: "call-1",
      content: "A tool result",
    });
  }
});

Deno.test("askAssistant records tool and model failures", async () => {
  const toolEvents: AssistantTrajectoryEventData[] = [];
  let completionCount = 0;
  await askAssistant({
    token: "test-token",
    baseUrl: "http://unused",
    model: "test-model",
    messages: [{ role: "user", content: "Run it" }],
    callTool: () => Promise.reject(new Error("tool exploded")),
    completion: () => {
      completionCount += 1;
      return modelReply(
        completionCount === 1
          ? {
            role: "assistant",
            tool_calls: [{
              id: "call-1",
              type: "function",
              function: { name: "broken_tool", arguments: "not-json" },
            }],
          }
          : { role: "assistant", content: "Recovered" },
      );
    },
    onTrajectoryEvent: (event) => {
      toolEvents.push(event);
    },
  });

  assertEquals(
    toolEvents.some((event) => event.type === "tool_call_failed"),
    true,
  );
  const started = toolEvents.find((event) =>
    event.type === "tool_call_started"
  );
  assertEquals(started?.type, "tool_call_started");
  if (started?.type === "tool_call_started") {
    assertEquals(started.rawArguments, "not-json");
    assertEquals(started.arguments, {});
  }

  const modelEvents: AssistantTrajectoryEventData[] = [];
  await assertRejects(
    () =>
      askAssistant({
        token: "test-token",
        baseUrl: "http://unused",
        model: "test-model",
        messages: [{ role: "user", content: "Fail" }],
        completion: () => Promise.reject(new Error("model unavailable")),
        onTrajectoryEvent: (event) => {
          modelEvents.push(event);
        },
      }),
    Error,
    "model unavailable",
  );
  assertEquals(modelEvents.map((event) => event.type), [
    "model_request",
    "model_failure",
  ]);
});

Deno.test("askAssistant records failed tool calls in the turn result", async () => {
  let completionCount = 0;
  const result = await askAssistant({
    token: "test-token",
    baseUrl: "http://unused",
    model: "test-model",
    messages: [{ role: "user", content: "Search" }],
    tools: [{
      type: "function",
      function: {
        name: "search_web",
        parameters: { type: "object", properties: {} },
      },
    }],
    callTool: () => Promise.reject(new Error("upstream is down")),
    completion: () => {
      completionCount += 1;
      return modelReply(
        completionCount === 1
          ? {
            role: "assistant",
            tool_calls: [{
              id: "call-1",
              type: "function",
              function: { name: "search_web", arguments: "{}" },
            }],
          }
          : { role: "assistant", content: "The search failed." },
      );
    },
  });

  assertEquals(result.toolInvocations.length, 1);
  assertEquals(result.toolInvocations[0].name, "search_web");
  assertEquals(result.toolInvocations[0].failed, true);
});

Deno.test("askAssistant disables reasoning on a plain ask and restores it for the final synthesis", async () => {
  const suppliedKwargs: (Record<string, unknown> | undefined)[] = [];
  let completionCount = 0;

  await askAssistant({
    token: "test-token",
    baseUrl: "http://unused",
    model: "test-model",
    messages: [{ role: "user", content: "Search for Morty" }],
    tools: [{
      type: "function",
      function: { name: "search_web", parameters: { type: "object" } },
    }],
    maxToolIterations: 1,
    callTool: () => Promise.resolve({ text: "A result", sources: [] }),
    completion: (params) => {
      suppliedKwargs.push(params.chatTemplateKwargs);
      completionCount += 1;

      return modelReply(
        completionCount === 1
          ? {
            role: "assistant",
            tool_calls: [{
              id: "call-1",
              type: "function",
              function: { name: "search_web", arguments: "{}" },
            }],
          }
          : { role: "assistant", content: "Found it." },
      );
    },
  });

  // First call is a plain question, so reasoning is switched off; the second is
  // the synthesis made after the tool budget ran out, which keeps it.
  assertEquals(suppliedKwargs, [{ enable_thinking: false }, undefined]);
});

Deno.test("askAssistant keeps reasoning on when the caller forces it", async () => {
  const suppliedKwargs: (Record<string, unknown> | undefined)[] = [];

  await askAssistant({
    token: "test-token",
    baseUrl: "http://unused",
    model: "test-model",
    messages: [{ role: "user", content: "Hello" }],
    thinking: "on",
    completion: (params) => {
      suppliedKwargs.push(params.chatTemplateKwargs);
      return modelReply({ role: "assistant", content: "Hi." });
    },
  });

  assertEquals(suppliedKwargs, [undefined]);
});

Deno.test("askAssistant sums token usage across every model call", async () => {
  let completionCount = 0;

  const result = await askAssistant({
    token: "test-token",
    baseUrl: "http://unused",
    model: "test-model",
    messages: [{ role: "user", content: "Search for Morty" }],
    tools: [{
      type: "function",
      function: { name: "search_web", parameters: { type: "object" } },
    }],
    maxToolIterations: 1,
    callTool: () => Promise.resolve({ text: "A result", sources: [] }),
    completion: () => {
      completionCount += 1;

      return modelReply(
        completionCount === 1
          ? {
            role: "assistant",
            tool_calls: [{
              id: "call-1",
              type: "function",
              function: { name: "search_web", arguments: "{}" },
            }],
          }
          : { role: "assistant", content: "Found it." },
        {
          promptTokens: 100 * completionCount,
          completionTokens: 10,
          cachedPromptTokens: 90 * completionCount,
        },
      );
    },
  });

  assertEquals(result.usage, {
    promptTokens: 300,
    completionTokens: 20,
    cachedPromptTokens: 270,
    modelCalls: 2,
  });
});

Deno.test("askAssistant runs concurrency-safe tools together and keeps result order", async () => {
  let running = 0;
  let peakConcurrency = 0;
  let completionCount = 0;
  const toolMessages: string[] = [];

  await askAssistant({
    token: "test-token",
    baseUrl: "http://unused",
    model: "test-model",
    messages: [{ role: "user", content: "Look two things up" }],
    tools: [{
      type: "function",
      function: { name: "search_web", parameters: { type: "object" } },
    }],
    maxToolIterations: 2,
    isConcurrencySafe: (name) => name === "search_web",
    callTool: async (_name, args) => {
      running += 1;
      peakConcurrency = Math.max(peakConcurrency, running);
      await new Promise((resolve) => setTimeout(resolve, 10));
      running -= 1;
      return { text: `result for ${args.query}`, sources: [] };
    },
    completion: (params) => {
      completionCount += 1;

      if (completionCount === 2) {
        for (const message of params.messages) {
          if (message.role === "tool") {
            toolMessages.push(messageText(message.content));
          }
        }
      }

      return modelReply(
        completionCount === 1
          ? {
            role: "assistant",
            tool_calls: [
              {
                id: "call-1",
                type: "function",
                function: {
                  name: "search_web",
                  arguments: '{"query":"first"}',
                },
              },
              {
                id: "call-2",
                type: "function",
                function: {
                  name: "search_web",
                  arguments: '{"query":"second"}',
                },
              },
            ],
          }
          : { role: "assistant", content: "Done." },
      );
    },
  });

  assertEquals(peakConcurrency, 2);
  assertEquals(toolMessages, ["result for first", "result for second"]);
});

Deno.test("askAssistant keeps a batch when one member rejects outside its tool call", async () => {
  const toolMessages: string[] = [];
  let completionCount = 0;
  let progressCalls = 0;

  await askAssistant({
    token: "test-token",
    baseUrl: "http://unused",
    model: "test-model",
    messages: [{ role: "user", content: "Look two things up" }],
    tools: [{
      type: "function",
      function: { name: "search_web", parameters: { type: "object" } },
    }],
    maxToolIterations: 2,
    isConcurrencySafe: (name) => name === "search_web",
    // Throwing on the second tool's progress report — before its try block —
    // rejects runToolCall itself rather than the tool it wraps. The batch
    // mapper runs its members in order, so counting the tool's own reports
    // identifies the second call.
    onProgress: (activity) => {
      if (activity === "search_web") {
        progressCalls += 1;
        if (progressCalls === 2) {
          throw new Error("progress reporting exploded");
        }
      }
    },
    callTool: (_name, args) =>
      Promise.resolve({
        text: `result for ${args.query}`,
        sources: [],
      }),
    completion: (params) => {
      completionCount += 1;

      if (completionCount === 2) {
        for (const message of params.messages) {
          if (message.role === "tool") {
            toolMessages.push(messageText(message.content));
          }
        }
      }

      return modelReply(
        completionCount === 1
          ? {
            role: "assistant",
            tool_calls: [
              {
                id: "call-1",
                type: "function",
                function: {
                  name: "search_web",
                  arguments: '{"query":"first"}',
                },
              },
              {
                id: "call-2",
                type: "function",
                function: {
                  name: "search_web",
                  arguments: '{"query":"second"}',
                },
              },
            ],
          }
          : { role: "assistant", content: "Done." },
      );
    },
  });

  assertEquals(toolMessages, [
    "result for first",
    'The tool "search_web" failed to run.',
  ]);
});

Deno.test("askAssistant keeps tools that are not concurrency-safe sequential", async () => {
  let running = 0;
  let peakConcurrency = 0;
  let completionCount = 0;

  await askAssistant({
    token: "test-token",
    baseUrl: "http://unused",
    model: "test-model",
    messages: [{ role: "user", content: "Do two things" }],
    tools: [{
      type: "function",
      function: { name: "bot_weather", parameters: { type: "object" } },
    }],
    maxToolIterations: 2,
    callTool: async () => {
      running += 1;
      peakConcurrency = Math.max(peakConcurrency, running);
      await new Promise((resolve) => setTimeout(resolve, 10));
      running -= 1;
      return { text: "delivered", sources: [] };
    },
    completion: () => {
      completionCount += 1;

      return modelReply(
        completionCount === 1
          ? {
            role: "assistant",
            tool_calls: [
              {
                id: "call-1",
                type: "function",
                function: { name: "bot_weather", arguments: "{}" },
              },
              {
                id: "call-2",
                type: "function",
                function: { name: "bot_weather", arguments: "{}" },
              },
            ],
          }
          : { role: "assistant", content: "Done." },
      );
    },
  });

  assertEquals(peakConcurrency, 1);
});
