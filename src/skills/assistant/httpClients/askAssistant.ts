import { getLogger } from "@std/log";
import {
  chatCompletion,
  DEFAULT_ASSISTANT_MAX_TURN_DURATION_MS,
  DEFAULT_ASSISTANT_STREAM_IDLE_TIMEOUT_MS,
} from "./chatCompletion.ts";
import { messageText } from "./types.ts";
import type {
  AssistantToolInvocation,
  AssistantTurnResult,
  AssistantTurnUsage,
  AssistantUsage,
  OpenAiMessage,
  OpenAiTool,
  OpenAiToolCall,
  Source,
  ToolCallResult,
} from "./types.ts";
import type {
  AssistantTrajectoryEventData,
  AssistantTrajectoryEventObserver,
} from "../trajectory/types.ts";
import { serializeTrajectoryError } from "../trajectory/recorder.ts";
import {
  type AssistantThinkingMode,
  classifyTurn,
  shouldThink,
} from "../utilities/thinkingPolicy.ts";

const logger = () => getLogger();

export interface AskAssistantParams {
  token: string;
  baseUrl: string;
  model: string;
  messages: OpenAiMessage[];
  tools?: OpenAiTool[];
  temperature?: number;
  maxTokens?: number;
  thinking?: AssistantThinkingMode;
  callTool?: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<ToolCallResult>;
  /**
   * Whether a tool can run alongside its siblings. Tools that deliver output
   * into the chat, or that queue a confirmation, must stay sequential so their
   * visible order matches the order the model asked for.
   */
  isConcurrencySafe?: (name: string) => boolean;
  onProgress?: (activity: string) => void;
  /**
   * Receives the answer as it is generated, as the cumulative text so far.
   * Called only while the response still looks like an answer; if it turns into
   * a tool call, `onPartialDiscarded` fires and this stops.
   */
  onPartial?: (partial: string) => void;
  onPartialDiscarded?: () => void;
  maxToolIterations?: number;
  idleTimeoutMs?: number;
  maxDurationMs?: number;
  completion?: typeof chatCompletion;
  onTrajectoryEvent?: AssistantTrajectoryEventObserver;
}

const DEFAULT_MAX_TOOL_ITERATIONS = 5;

/**
 * Folds one model call's usage into the running turn total.
 *
 * `cachedPromptTokens` is summed only across calls that actually reported it,
 * so a server without `--enable-cache-report` yields `undefined` for the turn
 * instead of a zero that would read as a genuine cache miss.
 */
const accumulateUsage = (
  total: AssistantTurnUsage | undefined,
  usage: AssistantUsage | undefined,
): AssistantTurnUsage | undefined => {
  if (!usage) {
    return total;
  }

  const cached = total?.cachedPromptTokens;
  const nextCached = usage.cachedPromptTokens === undefined
    ? cached
    : (cached ?? 0) + usage.cachedPromptTokens;

  return {
    promptTokens: (total?.promptTokens ?? 0) + usage.promptTokens,
    completionTokens: (total?.completionTokens ?? 0) + usage.completionTokens,
    modelCalls: (total?.modelCalls ?? 0) + 1,
    ...(nextCached === undefined ? {} : { cachedPromptTokens: nextCached }),
  };
};

const parseToolArguments = (raw: string): Record<string, unknown> => {
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
};

export const askAssistant = async (
  params: AskAssistantParams,
): Promise<AssistantTurnResult> => {
  const {
    token,
    baseUrl,
    model,
    messages,
    tools,
    temperature,
    maxTokens,
    thinking = "auto",
    callTool,
    isConcurrencySafe = () => false,
    onProgress,
    onPartial,
    onPartialDiscarded,
    maxToolIterations = DEFAULT_MAX_TOOL_ITERATIONS,
    idleTimeoutMs = DEFAULT_ASSISTANT_STREAM_IDLE_TIMEOUT_MS,
    maxDurationMs = DEFAULT_ASSISTANT_MAX_TURN_DURATION_MS,
    completion = chatCompletion,
    onTrajectoryEvent,
  } = params;

  const observe = async (event: AssistantTrajectoryEventData) => {
    if (!onTrajectoryEvent) {
      return;
    }

    try {
      await onTrajectoryEvent(structuredClone(event));
    } catch (error) {
      logger().error("Assistant trajectory observer failed.");
      logger().error(error);
    }
  };

  const conversation: OpenAiMessage[] = [...messages];
  const sources: Source[] = [];
  const toolInvocations: AssistantToolInvocation[] = [];
  const mediaNotes: string[] = [];
  let deliveredToChat = false;
  let confirmationId: string | undefined;
  let usage: AssistantTurnUsage | undefined;
  let toolFailed = false;
  let iterations = 0;
  const startedAt = performance.now();

  while (true) {
    onProgress?.("thinking");
    const canUseTools = iterations < Math.max(0, maxToolIterations);
    const iteration = iterations + 1;
    const remainingDurationMs = maxDurationMs -
      (performance.now() - startedAt);
    if (remainingDurationMs <= 0) {
      throw new Error("Assistant request exceeded maximum duration.");
    }
    // The tool schemas stay in every request even once the iteration budget is
    // spent. Chat templates render them into the head of the prompt, so
    // dropping them would shift the whole prefix and force the inference server
    // to prefill the longest request of the turn from scratch. `tool_choice`
    // forbids further calls without touching a single cached token.
    const requestTools = tools && tools.length > 0 ? tools : [];
    const toolChoice = requestTools.length > 0 && !canUseTools
      ? "none" as const
      : undefined;
    const turnKind = classifyTurn({
      usedTools: toolInvocations.length > 0,
      toolFailed,
      budgetExhausted: !canUseTools,
    });
    // Only ever spelled out when thinking is being turned off; leaving the
    // argument out lets the model's own template default stand.
    const chatTemplateKwargs = shouldThink(thinking, turnKind)
      ? undefined
      : { enable_thinking: false };
    await observe({
      type: "model_request",
      iteration,
      messages: conversation,
      tools: requestTools,
    });

    const modelStartedAt = performance.now();
    let message: OpenAiMessage;
    let callUsage: AssistantUsage | undefined;
    let partial = "";
    let abandoned = false;
    try {
      const completed = await completion({
        token,
        baseUrl,
        model,
        messages: conversation,
        tools: requestTools.length > 0 ? requestTools : undefined,
        ...(toolChoice ? { toolChoice } : {}),
        ...(chatTemplateKwargs ? { chatTemplateKwargs } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { maxTokens } : {}),
        idleTimeoutMs,
        timeoutMs: Math.ceil(remainingDurationMs),
        stream: {
          onDelta: (text) => {
            if (abandoned) {
              return;
            }
            partial += text;
            onPartial?.(partial);
          },
          onToolCall: () => {
            abandoned = true;
            partial = "";
            onPartialDiscarded?.();
          },
        },
      });
      message = completed.message;
      callUsage = completed.usage;
      usage = accumulateUsage(usage, callUsage);
    } catch (error) {
      await observe({
        type: "model_failure",
        iteration,
        durationMs: performance.now() - modelStartedAt,
        error: serializeTrajectoryError(error),
      });
      throw error;
    }
    await observe({
      type: "model_response",
      iteration,
      durationMs: performance.now() - modelStartedAt,
      message,
      ...(callUsage ? { usage: callUsage } : {}),
    });

    const toolCalls = message.tool_calls ?? [];

    if (toolCalls.length > 0 && callTool && canUseTools) {
      conversation.push({
        role: "assistant",
        content: message.content ?? "",
        tool_calls: toolCalls,
      });

      const runToolCall = async (toolCall: OpenAiToolCall) => {
        const name = toolCall.function.name;
        const args = parseToolArguments(toolCall.function.arguments);
        onProgress?.(name);
        await observe({
          type: "tool_call_started",
          iteration,
          toolCallId: toolCall.id,
          name,
          rawArguments: toolCall.function.arguments,
          arguments: args,
        });

        const toolStartedAt = performance.now();
        try {
          const result = await callTool(name, args);
          const durationMs = performance.now() - toolStartedAt;
          await observe({
            type: "tool_call_completed",
            iteration,
            toolCallId: toolCall.id,
            name,
            durationMs,
            result,
          });
          return {
            result,
            invocation: { name, durationMs: Math.round(durationMs) },
            failed: false,
          };
        } catch (error) {
          logger().error(`Tool "${name}" failed.`);
          logger().error(error);
          const result: ToolCallResult = {
            text: `The tool "${name}" failed to run.`,
            sources: [],
          };
          const durationMs = performance.now() - toolStartedAt;
          await observe({
            type: "tool_call_failed",
            iteration,
            toolCallId: toolCall.id,
            name,
            durationMs,
            error: serializeTrajectoryError(error),
            fallbackResult: result,
          });
          return {
            result,
            invocation: {
              name,
              failed: true,
              durationMs: Math.round(durationMs),
            },
            failed: true,
          };
        }
      };

      // Consecutive concurrency-safe calls run together — a turn with three web
      // searches has no reason to serialize three round trips — while anything
      // else keeps its place in the queue. Grouping only adjacent calls means
      // the results still land in the order the model asked for them.
      const outcomes: Array<Awaited<ReturnType<typeof runToolCall>>> = [];
      let batch: OpenAiToolCall[] = [];
      const flushBatch = async () => {
        if (batch.length === 0) {
          return;
        }
        // runToolCall already turns tool failures into outcomes, so a
        // rejection here means something around the call threw. allSettled
        // keeps one member's rejection from discarding its batch siblings,
        // and the fallback still hands the model one result per tool call it
        // made.
        const settled = await Promise.allSettled(batch.map(runToolCall));
        outcomes.push(
          ...settled.map((outcome, index) => {
            if (outcome.status === "fulfilled") {
              return outcome.value;
            }
            const name = batch[index].function.name;
            logger().error(`Tool "${name}" failed outside its error handling.`);
            logger().error(outcome.reason);
            return {
              result: {
                text: `The tool "${name}" failed to run.`,
                sources: [],
              },
              invocation: { name, failed: true, durationMs: 0 },
              failed: true,
            };
          }),
        );
        batch = [];
      };

      for (const toolCall of toolCalls) {
        if (isConcurrencySafe(toolCall.function.name)) {
          batch.push(toolCall);
          continue;
        }
        await flushBatch();
        outcomes.push(await runToolCall(toolCall));
      }
      await flushBatch();

      for (const [index, outcome] of outcomes.entries()) {
        const { result, invocation, failed } = outcome;
        toolInvocations.push(invocation);
        toolFailed ||= failed;

        for (const source of result.sources) {
          if (!sources.some((existing) => existing.url === source.url)) {
            sources.push(source);
          }
        }
        deliveredToChat ||= result.deliveredToChat === true;
        confirmationId ??= result.confirmationId;
        mediaNotes.push(...(result.mediaNotes ?? []));

        conversation.push({
          role: "tool",
          tool_call_id: toolCalls[index].id,
          content: result.text,
        });
      }

      iterations += 1;
      if (iterations >= maxToolIterations) {
        conversation.push({
          role: "user",
          content:
            "You have used all of your tool calls. Answer now using only the information you have gathered.",
        });
        continue;
      }

      continue;
    }

    const content = messageText(message.content);
    if (content.trim().length === 0) {
      throw new Error("Assistant endpoint returned an empty response.");
    }

    const result: AssistantTurnResult = {
      content,
      sources,
      toolInvocations,
      ...(usage ? { usage } : {}),
      ...(deliveredToChat ? { deliveredToChat: true } : {}),
      ...(confirmationId ? { confirmationId } : {}),
      ...(mediaNotes.length > 0 ? { mediaNotes } : {}),
    };
    await observe({ type: "final_response", result });
    return result;
  }
};
