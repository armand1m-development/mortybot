import type { OpenAiTool, ToolCallResult } from "../httpClients/types.ts";
import { normalizeOpenAiTools } from "../utilities/normalizeTools.ts";

/**
 * Where the bot lives, so the clock tool reports the operator's wall-clock
 * time regardless of the container's timezone.
 */
export const ASSISTANT_CLOCK_TIME_ZONE = "Europe/Amsterdam";

/**
 * Renders the clock reading the model receives: local Amsterdam time with a
 * weekday, UTC, and the epoch, so a reply can anchor "now", compute ages, and
 * derive any other timezone from UTC.
 */
export const formatClockReading = (now: Date): string => {
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ASSISTANT_CLOCK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ASSISTANT_CLOCK_TIME_ZONE,
    weekday: "long",
  });

  // en-CA formats as "YYYY-MM-DD, HH:mm:ss".
  const [date = "", time = ""] = dateFormatter.format(now).split(", ");
  const weekday = weekdayFormatter.format(now);
  const epochSeconds = `${Math.floor(now.getTime() / 1000)}.${
    String(now.getMilliseconds()).padStart(3, "0")
  }`;

  return [
    `Amsterdam (${ASSISTANT_CLOCK_TIME_ZONE}): ${weekday} ${date} ${time}`,
    `UTC: ${now.toISOString().slice(0, 19)}Z`,
    `Epoch: ${epochSeconds}s`,
  ].join("\n");
};

const getClockTool = (): OpenAiTool => ({
  type: "function",
  function: {
    name: "get_time",
    description:
      "Returns the bot's current wall-clock time: local time in Amsterdam (Europe/Amsterdam), UTC, and the Unix epoch. Call it whenever an answer depends on what 'now' is — the current time or date, how old something is, whether an event has passed — and never guess the time from context.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
});

/**
 * Built-in assistant tools: model-facing capabilities that need no bot
 * command and no MCP subprocess, answered straight from the bot's own
 * process.
 */
const handlers: Record<
  string,
  (now: () => Date) => ToolCallResult
> = {
  get_time: (now) => ({ text: formatClockReading(now()), sources: [] }),
};

const BUILTIN_ASSISTANT_TOOLS = normalizeOpenAiTools(
  Object.keys(handlers).map((name) => {
    if (name !== "get_time") {
      throw new Error(`No OpenAI tool definition for built-in "${name}".`);
    }
    return getClockTool();
  }),
);

/**
 * The same array instance on every call, so the middleware's merge can keep
 * returning its memoized tool set and the serialized tool block stays
 * byte-identical across turns for the inference server's prefix cache.
 */
export const getBuiltinAssistantTools = (): OpenAiTool[] =>
  BUILTIN_ASSISTANT_TOOLS;

/**
 * Runs a built-in tool by name, or returns undefined when the name belongs to
 * another registry, letting the caller fall through to its next source.
 */
export const callBuiltinAssistantTool = (
  name: string,
  now: () => Date = () => new Date(),
): ToolCallResult | undefined => handlers[name]?.(now);
