import { getLogger } from "@std/log";
import type { AssistantUsage, OpenAiMessage, OpenAiTool } from "./types.ts";

const logger = () => getLogger();

/**
 * Notifications emitted while a response is still arriving, so callers can show
 * the answer as it is written instead of after it is finished.
 */
export interface ChatCompletionStreamHandlers {
  /** One newly arrived fragment of the answer. */
  onDelta?: (text: string) => void;
  /**
   * Fired once when the response turns out to be a tool call rather than an
   * answer. Anything already shown from `onDelta` should be withdrawn.
   */
  onToolCall?: () => void;
}

export interface ChatCompletionParams {
  token: string;
  baseUrl: string;
  model: string;
  messages: OpenAiMessage[];
  tools?: OpenAiTool[];
  toolChoice?: "auto" | "none" | "required";
  /**
   * Extra arguments handed to the server's chat template, e.g. Qwen3's
   * `enable_thinking`. The template renders these at the generation-prompt
   * tail, so changing them between turns does not disturb the cached prefix.
   */
  chatTemplateKwargs?: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  idleTimeoutMs?: number;
  stream?: ChatCompletionStreamHandlers;
  fetcher?: typeof fetch;
}

export interface ChatCompletionResult {
  message: OpenAiMessage;
  usage?: AssistantUsage;
}

interface RawUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
  };
}

interface ChatCompletionResponse {
  choices: Array<{ message: OpenAiMessage }>;
  usage?: RawUsage;
}

interface ChatCompletionChunk {
  choices?: Array<{
    delta?: {
      content?: string | null;
      tool_calls?: Array<{
        index?: number;
        id?: string;
        type?: "function";
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
  }>;
  usage?: RawUsage;
  error?: unknown;
}

export const DEFAULT_ASSISTANT_STREAM_IDLE_TIMEOUT_MS = 120_000;
export const DEFAULT_ASSISTANT_MAX_TURN_DURATION_MS = 15 * 60_000;

type TimeoutKind = "idle" | "maximum";

/**
 * Normalizes an OpenAI-shaped `usage` object.
 *
 * `cached_tokens` is only present when SGLang runs with `--enable-cache-report`.
 * When it is missing we leave `cachedPromptTokens` undefined rather than
 * defaulting to 0, so telemetry can tell "no cache report" apart from "nothing
 * was cached".
 */
const normalizeUsage = (
  usage: RawUsage | undefined,
): AssistantUsage | undefined => {
  if (!usage) {
    return undefined;
  }

  const promptTokens = usage.prompt_tokens;
  const completionTokens = usage.completion_tokens;
  if (
    typeof promptTokens !== "number" || typeof completionTokens !== "number"
  ) {
    return undefined;
  }

  const cached = usage.prompt_tokens_details?.cached_tokens;

  return {
    promptTokens,
    completionTokens,
    ...(typeof cached === "number" ? { cachedPromptTokens: cached } : {}),
  };
};

/** Extracts the `data:` payload from one server-sent event block. */
const eventPayload = (event: string): string =>
  event.split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n")
    .trim();

/**
 * Reassembles a streamed completion one event at a time.
 *
 * Shared by the incremental reader and the buffered fallback so both paths
 * behave identically and are covered by the same tests.
 */
const createCompletionAccumulator = (
  handlers: ChatCompletionStreamHandlers = {},
) => {
  const content: string[] = [];
  const toolCalls = new Map<
    number,
    {
      id: string;
      type: "function";
      function: { name: string; arguments: string };
    }
  >();
  let receivedChunk = false;
  let announcedToolCall = false;
  let usage: AssistantUsage | undefined;

  const push = (payload: string): void => {
    if (payload.length === 0 || payload === "[DONE]") {
      return;
    }

    let chunk: ChatCompletionChunk;
    try {
      chunk = JSON.parse(payload) as ChatCompletionChunk;
    } catch {
      throw new Error("Assistant endpoint returned a malformed stream.");
    }

    if (chunk.error !== undefined) {
      throw new Error("Assistant endpoint stream returned an error.");
    }

    // The usage chunk emitted by `stream_options.include_usage` carries an
    // empty `choices` array, so it never counts as a content chunk.
    usage = normalizeUsage(chunk.usage) ?? usage;

    for (const choice of chunk.choices ?? []) {
      const delta = choice.delta;
      if (!delta) {
        continue;
      }
      receivedChunk = true;
      if (typeof delta.content === "string" && delta.content.length > 0) {
        content.push(delta.content);
        if (!announcedToolCall) {
          handlers.onDelta?.(delta.content);
        }
      }

      for (const [position, fragment] of (delta.tool_calls ?? []).entries()) {
        if (!announcedToolCall) {
          announcedToolCall = true;
          handlers.onToolCall?.();
        }

        const index = Number.isInteger(fragment.index)
          ? fragment.index!
          : position;
        const existing = toolCalls.get(index) ?? {
          id: "",
          type: "function" as const,
          function: { name: "", arguments: "" },
        };
        existing.id += fragment.id ?? "";
        existing.function.name += fragment.function?.name ?? "";
        existing.function.arguments += fragment.function?.arguments ?? "";
        toolCalls.set(index, existing);
      }
    }
  };

  const result = (): ChatCompletionResult => {
    if (!receivedChunk) {
      throw new Error("Assistant endpoint returned no message.");
    }

    const calls = [...toolCalls.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, call]) => call);

    return {
      message: {
        role: "assistant",
        content: content.join(""),
        ...(calls.length > 0 ? { tool_calls: calls } : {}),
      },
      ...(usage ? { usage } : {}),
    };
  };

  return { push, result };
};

const readResponseBody = async (
  response: Response,
  onActivity: () => void,
  signal: AbortSignal,
): Promise<string> => {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) {
        throw signal.reason;
      }
      if (done) {
        body += decoder.decode();
        return body;
      }
      onActivity();
      body += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
};

const parseJsonCompletion = (body: string): ChatCompletionResult => {
  let data: ChatCompletionResponse;
  try {
    data = JSON.parse(body) as ChatCompletionResponse;
  } catch {
    throw new Error("Assistant endpoint returned malformed JSON.");
  }

  const message = data.choices?.[0]?.message;
  if (!message) {
    throw new Error("Assistant endpoint returned no message.");
  }

  const usage = normalizeUsage(data.usage);
  return { message, ...(usage ? { usage } : {}) };
};

const parseStreamingCompletion = (body: string): ChatCompletionResult => {
  const accumulator = createCompletionAccumulator();
  for (const event of body.replaceAll("\r\n", "\n").split("\n\n")) {
    accumulator.push(eventPayload(event));
  }
  return accumulator.result();
};

/**
 * Consumes a server-sent event stream as it arrives, dispatching each event to
 * the accumulator instead of waiting for the whole body. This is what lets the
 * caller show the answer while it is still being generated.
 */
const streamCompletion = async (
  response: Response,
  onActivity: () => void,
  signal: AbortSignal,
  handlers: ChatCompletionStreamHandlers | undefined,
): Promise<ChatCompletionResult> => {
  const accumulator = createCompletionAccumulator(handlers);

  if (!response.body) {
    throw new Error("Assistant endpoint returned no message.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const drain = () => {
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      accumulator.push(eventPayload(buffer.slice(0, boundary)));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) {
        throw signal.reason;
      }
      if (done) {
        buffer += decoder.decode();
        break;
      }
      onActivity();
      buffer += decoder.decode(value, { stream: true });
      // Normalized on the whole buffer because a CRLF can straddle two chunks.
      // The buffer never outgrows a single event, so this stays cheap.
      buffer = buffer.replaceAll("\r\n", "\n");
      drain();
    }

    buffer = buffer.replaceAll("\r\n", "\n");
    drain();
    if (buffer.trim().length > 0) {
      accumulator.push(eventPayload(buffer));
    }

    return accumulator.result();
  } finally {
    reader.releaseLock();
  }
};

export const chatCompletion = async (
  params: ChatCompletionParams,
): Promise<ChatCompletionResult> => {
  const {
    token,
    baseUrl,
    model,
    messages,
    tools,
    toolChoice,
    chatTemplateKwargs,
    temperature,
    maxTokens,
    timeoutMs = DEFAULT_ASSISTANT_MAX_TURN_DURATION_MS,
    idleTimeoutMs = DEFAULT_ASSISTANT_STREAM_IDLE_TIMEOUT_MS,
    stream,
    fetcher = fetch,
  } = params;

  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

  const controller = new AbortController();
  let timeoutKind: TimeoutKind | undefined;
  let idleTimeout: ReturnType<typeof setTimeout> | undefined;
  const abortForTimeout = (kind: TimeoutKind) => {
    if (!controller.signal.aborted) {
      timeoutKind = kind;
      controller.abort();
    }
  };
  const resetIdleTimeout = () => {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(
      () => abortForTimeout("idle"),
      idleTimeoutMs,
    );
  };
  const maximumTimeout = setTimeout(
    () => abortForTimeout("maximum"),
    timeoutMs,
  );
  resetIdleTimeout();

  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        messages,
        ...(tools && tools.length > 0 ? { tools } : {}),
        ...(toolChoice !== undefined ? { tool_choice: toolChoice } : {}),
        ...(chatTemplateKwargs
          ? { chat_template_kwargs: chatTemplateKwargs }
          : {}),
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
        stream: true,
        stream_options: { include_usage: true },
      }),
      signal: controller.signal,
    });
    resetIdleTimeout();

    if (!response.ok) {
      const body = await readResponseBody(
        response,
        resetIdleTimeout,
        controller.signal,
      );
      logger().error(
        `Assistant endpoint responded with status ${response.status}.`,
      );
      logger().debug(`Response body: ${body}`);
      throw new Error(
        `Assistant endpoint responded with status ${response.status}.`,
      );
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ??
      "";
    if (contentType.includes("text/event-stream")) {
      return await streamCompletion(
        response,
        resetIdleTimeout,
        controller.signal,
        stream,
      );
    }

    // A server that answers without the streaming content type is buffered and
    // sniffed instead, so an OpenAI-compatible endpoint that ignores `stream`
    // still works — it just cannot deliver progressive updates.
    const body = await readResponseBody(
      response,
      resetIdleTimeout,
      controller.signal,
    );

    return body.trimStart().startsWith("data:")
      ? parseStreamingCompletion(body)
      : parseJsonCompletion(body);
  } catch (error) {
    if (timeoutKind === "idle") {
      logger().error(
        `Assistant response stalled for ${idleTimeoutMs}ms.`,
      );
      throw new Error("Assistant response stalled.");
    }
    if (timeoutKind === "maximum") {
      logger().error(
        `Assistant request exceeded its ${timeoutMs}ms maximum duration.`,
      );
      throw new Error("Assistant request exceeded maximum duration.");
    }

    throw error;
  } finally {
    clearTimeout(idleTimeout);
    clearTimeout(maximumTimeout);
  }
};
