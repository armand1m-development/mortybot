import type { AssistantThinkingMode } from "/src/skills/assistant/utilities/thinkingPolicy.ts";

export interface Configuration {
  dataPath: string;
  botToken: string;
  exchangeApiToken: string;
  openWeatherMapApiToken: string;
  googleMapsApiToken: string;
  n2yoApiToken: string;
  inlineQuerySourceChatId: string;
  mainMemeTemplateChatSessionPath: string;
  apiPort: number;
  sentryDSN: string;
  environment: "development" | "production";
  openAiBaseUrl: string;
  openAiModel: string;
  openAiApiKey: string;
  assistantAllowedChatIds: number[];
  assistantStreamIdleTimeoutMs: number;
  assistantMaxTurnDurationMs: number;
  assistantTemperature: number;
  assistantMaxTokens: number;
  assistantThinking: AssistantThinkingMode;
  /** Whether media posted in the chat is described for the assistant. */
  assistantVisionEnabled: boolean;
  /** Hard ceiling on images described per turn, across every attachment. */
  assistantVisionMaxImages: number;
  /** Frames sampled from each video before it is described. */
  assistantVideoFrames: number;
  assistantTrajectoryEnabled: boolean;
  mcpConfigPath: string;
}

export interface ConfigurationContext {
  configuration: Configuration;
}
