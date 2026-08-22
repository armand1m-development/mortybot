import * as dotenv from "@std/dotenv";
import type { Configuration } from "/src/platform/configuration/middlewares/types.ts";
import type { AssistantThinkingMode } from "/src/skills/assistant/utilities/thinkingPolicy.ts";
import {
  DEFAULT_ASSISTANT_MAX_TURN_DURATION_MS,
  DEFAULT_ASSISTANT_STREAM_IDLE_TIMEOUT_MS,
} from "/src/skills/assistant/httpClients/chatCompletion.ts";
import { DEFAULT_TAILNET_KEEPALIVE_INTERVAL_MS } from "/src/tailnetKeepalive.ts";

export const DEFAULT_API_PORT = 3_000;

export const parseApiPort = (value: string | undefined): number => {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_API_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new TypeError(
      `API_PORT must be an integer between 1 and 65535; received "${value}".`,
    );
  }

  return port;
};

export const parseAssistantAllowedChatIds = (
  value: string | undefined,
): number[] => {
  if (value === undefined || value.trim() === "") {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const chatId = Number(entry);
      if (!Number.isInteger(chatId)) {
        throw new TypeError(
          `ASSISTANT_ALLOWED_CHAT_IDS must contain integers; received "${entry}".`,
        );
      }
      return chatId;
    });
};

export const parseTailnetKeepaliveUrls = (
  value: string | undefined,
): string[] => {
  if (value === undefined || value.trim() === "") {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

export const parsePositiveInteger = (
  name: string,
  value: string | undefined,
  defaultValue: number,
): number => {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new TypeError(
      `${name} must be a positive integer; received "${value}".`,
    );
  }
  return parsed;
};

export const DEFAULT_ASSISTANT_THINKING: AssistantThinkingMode = "auto";

export const parseAssistantThinking = (
  value: string | undefined,
): AssistantThinkingMode => {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_ASSISTANT_THINKING;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "off" || normalized === "auto" || normalized === "on") {
    return normalized;
  }

  throw new TypeError(
    `ASSISTANT_THINKING must be "off", "auto" or "on"; received "${value}".`,
  );
};

/**
 * Images described per turn.
 *
 * Vision models charge for pixels in prompt tokens, so this is the knob that
 * keeps an eight-photo album from costing more than the conversation it is
 * part of. Four covers the road-camera media groups the bot posts.
 */
export const DEFAULT_ASSISTANT_VISION_MAX_IMAGES = 4;

/** Frames sampled per video. Enough to see a clip change, not to re-watch it. */
export const DEFAULT_ASSISTANT_VIDEO_FRAMES = 4;

export const DEFAULT_ASSISTANT_TEMPERATURE = 0.7;
export const DEFAULT_ASSISTANT_MAX_TOKENS = 2_000;

export const parseUnitInterval = (
  name: string,
  value: string | undefined,
  defaultValue: number,
): number => {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2) {
    throw new TypeError(
      `${name} must be a number between 0 and 2; received "${value}".`,
    );
  }
  return parsed;
};

export const parseBoolean = (
  name: string,
  value: string | undefined,
  defaultValue: boolean,
): boolean => {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }

  throw new TypeError(
    `${name} must be either "true" or "false"; received "${value}".`,
  );
};

export const loadEnvironment = async (): Promise<Configuration> => {
  await dotenv.load({
    export: true,
  });

  const environment = Deno.env.get("ENVIRONMENT")! === "production"
    ? "production"
    : "development";

  return {
    dataPath: Deno.env.get("DATA_PATH")!,
    botToken: Deno.env.get("BOT_TOKEN")!,
    environment,
    exchangeApiToken: Deno.env.get("EXCHANGE_API_TOKEN")!,
    openWeatherMapApiToken: Deno.env.get("OPENWEATHERMAP_API_TOKEN")!,
    googleMapsApiToken: Deno.env.get("GOOGLEMAPS_API_TOKEN")!,
    n2yoApiToken: Deno.env.get("N2YO_API_TOKEN")!,
    inlineQuerySourceChatId: Deno.env.get("INLINE_QUERY_SOURCE_CHAT_ID")!,
    mainMemeTemplateChatSessionPath: Deno.env.get(
      "MAIN_MEME_TEMPLATE_CHAT_SESSION_PATH",
    )!,
    apiPort: parseApiPort(Deno.env.get("API_PORT")),
    sentryDSN: Deno.env.get("SENTRY_DSN")!,
    openAiBaseUrl: Deno.env.get("OPENAI_BASE_URL")!,
    openAiModel: Deno.env.get("OPENAI_MODEL")!,
    openAiApiKey: Deno.env.get("OPENAI_API_KEY")!,
    assistantAllowedChatIds: parseAssistantAllowedChatIds(
      Deno.env.get("ASSISTANT_ALLOWED_CHAT_IDS"),
    ),
    assistantStreamIdleTimeoutMs: parsePositiveInteger(
      "ASSISTANT_STREAM_IDLE_TIMEOUT_MS",
      Deno.env.get("ASSISTANT_STREAM_IDLE_TIMEOUT_MS"),
      DEFAULT_ASSISTANT_STREAM_IDLE_TIMEOUT_MS,
    ),
    assistantMaxTurnDurationMs: parsePositiveInteger(
      "ASSISTANT_MAX_TURN_DURATION_MS",
      Deno.env.get("ASSISTANT_MAX_TURN_DURATION_MS"),
      DEFAULT_ASSISTANT_MAX_TURN_DURATION_MS,
    ),
    assistantTemperature: parseUnitInterval(
      "ASSISTANT_TEMPERATURE",
      Deno.env.get("ASSISTANT_TEMPERATURE"),
      DEFAULT_ASSISTANT_TEMPERATURE,
    ),
    assistantMaxTokens: parsePositiveInteger(
      "ASSISTANT_MAX_TOKENS",
      Deno.env.get("ASSISTANT_MAX_TOKENS"),
      DEFAULT_ASSISTANT_MAX_TOKENS,
    ),
    assistantThinking: parseAssistantThinking(
      Deno.env.get("ASSISTANT_THINKING"),
    ),
    assistantVisionEnabled: parseBoolean(
      "ASSISTANT_VISION_ENABLED",
      Deno.env.get("ASSISTANT_VISION_ENABLED"),
      true,
    ),
    assistantVisionMaxImages: parsePositiveInteger(
      "ASSISTANT_VISION_MAX_IMAGES",
      Deno.env.get("ASSISTANT_VISION_MAX_IMAGES"),
      DEFAULT_ASSISTANT_VISION_MAX_IMAGES,
    ),
    assistantVideoFrames: parsePositiveInteger(
      "ASSISTANT_VIDEO_FRAMES",
      Deno.env.get("ASSISTANT_VIDEO_FRAMES"),
      DEFAULT_ASSISTANT_VIDEO_FRAMES,
    ),
    assistantTrajectoryEnabled: parseBoolean(
      "ASSISTANT_TRAJECTORY_ENABLED",
      Deno.env.get("ASSISTANT_TRAJECTORY_ENABLED"),
      false,
    ),
    mcpConfigPath: Deno.env.get("MCP_CONFIG") ?? "./mcp.json",
    tailnetKeepaliveEnabled: parseBoolean(
      "TAILNET_KEEPALIVE_ENABLED",
      Deno.env.get("TAILNET_KEEPALIVE_ENABLED"),
      true,
    ),
    tailnetKeepaliveIntervalMs: parsePositiveInteger(
      "TAILNET_KEEPALIVE_INTERVAL_MS",
      Deno.env.get("TAILNET_KEEPALIVE_INTERVAL_MS"),
      DEFAULT_TAILNET_KEEPALIVE_INTERVAL_MS,
    ),
    tailnetKeepaliveUrls: parseTailnetKeepaliveUrls(
      Deno.env.get("TAILNET_KEEPALIVE_URLS"),
    ),
  };
};
