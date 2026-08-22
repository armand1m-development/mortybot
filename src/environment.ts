import * as dotenv from "@std/dotenv";
import type { Configuration } from "/src/platform/configuration/middlewares/types.ts";
import type { AssistantThinkingMode } from "/src/skills/assistant/utilities/thinkingPolicy.ts";
import {
  DEFAULT_ASSISTANT_MAX_TURN_DURATION_MS,
  DEFAULT_ASSISTANT_STREAM_IDLE_TIMEOUT_MS,
} from "/src/skills/assistant/httpClients/chatCompletion.ts";

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

export interface AssistantEndpointVariables {
  openAiBaseUrl: string | undefined;
  openAiModel: string | undefined;
  openAiApiKey: string | undefined;
}

/**
 * Validates the OpenAI-compatible endpoint variables the assistant talks to.
 *
 * The assistant reaches for them on its very first turn, so a missing value
 * would otherwise surface as a TypeError in the middle of a conversation
 * instead of at boot — in production this was observed as `Cannot read
 * properties of undefined (reading 'replace')` from chatCompletion. Require
 * all three whenever the assistant can run: with an allowlist configured, or
 * in development, where an empty allowlist admits every chat. When it is off
 * everywhere, empty strings are fine — nothing reads them.
 */
export const parseAssistantEndpoint = (
  environment: "development" | "production",
  assistantAllowedChatIds: number[],
  variables: AssistantEndpointVariables,
): { openAiBaseUrl: string; openAiModel: string; openAiApiKey: string } => {
  const assistantEnabled = assistantAllowedChatIds.length > 0 ||
    environment === "development";

  const read = (name: string, value: string | undefined): string => {
    if ((value ?? "").trim() === "" && assistantEnabled) {
      throw new TypeError(
        `${name} is required when the assistant is enabled (ASSISTANT_ALLOWED_CHAT_IDS is set, or ENVIRONMENT is "development").`,
      );
    }
    return value ?? "";
  };

  return {
    openAiBaseUrl: read("OPENAI_BASE_URL", variables.openAiBaseUrl),
    openAiModel: read("OPENAI_MODEL", variables.openAiModel),
    openAiApiKey: read("OPENAI_API_KEY", variables.openAiApiKey),
  };
};

export const loadEnvironment = async (): Promise<Configuration> => {
  await dotenv.load({
    export: true,
  });

  const environment = Deno.env.get("ENVIRONMENT")! === "production"
    ? "production"
    : "development";

  const assistantAllowedChatIds = parseAssistantAllowedChatIds(
    Deno.env.get("ASSISTANT_ALLOWED_CHAT_IDS"),
  );
  const { openAiBaseUrl, openAiModel, openAiApiKey } = parseAssistantEndpoint(
    environment,
    assistantAllowedChatIds,
    {
      openAiBaseUrl: Deno.env.get("OPENAI_BASE_URL"),
      openAiModel: Deno.env.get("OPENAI_MODEL"),
      openAiApiKey: Deno.env.get("OPENAI_API_KEY"),
    },
  );

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
    openAiBaseUrl,
    openAiModel,
    openAiApiKey,
    assistantAllowedChatIds,
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
  };
};
