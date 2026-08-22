import type {
  AssistantTurnResult,
  AssistantUsage,
  OpenAiMessage,
  OpenAiTool,
  ToolCallResult,
} from "../httpClients/types.ts";

export interface SerializedTrajectoryError {
  name: string;
  message: string;
  stack?: string;
}

interface TrajectoryEventEnvelope {
  sequence: number;
  timestamp: string;
}

export type AssistantTrajectoryEventData =
  | {
    type: "model_request";
    iteration: number;
    messages: OpenAiMessage[];
    tools: OpenAiTool[];
  }
  | {
    type: "model_response";
    iteration: number;
    durationMs: number;
    message: OpenAiMessage;
    usage?: AssistantUsage;
  }
  | {
    type: "model_failure";
    iteration: number;
    durationMs: number;
    error: SerializedTrajectoryError;
  }
  | {
    type: "tool_call_started";
    iteration: number;
    toolCallId: string;
    name: string;
    rawArguments: string;
    arguments: Record<string, unknown>;
  }
  | {
    type: "tool_call_completed";
    iteration: number;
    toolCallId: string;
    name: string;
    durationMs: number;
    result: ToolCallResult;
  }
  | {
    type: "tool_call_failed";
    iteration: number;
    toolCallId: string;
    name: string;
    durationMs: number;
    error: SerializedTrajectoryError;
    fallbackResult: ToolCallResult;
  }
  | {
    type: "final_response";
    result: AssistantTurnResult;
  }
  | {
    type: "delivery_succeeded";
    content: string;
    messageIds: number[];
    fileNames: string[];
  }
  | {
    type: "delivery_failed";
    error: SerializedTrajectoryError;
  };

export type AssistantTrajectoryEvent =
  & AssistantTrajectoryEventData
  & TrajectoryEventEnvelope;

export interface AssistantTrajectoryV1 {
  schemaVersion: 1;
  trajectoryId: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  status: "in_progress" | "succeeded" | "failed";
  context: {
    chatId: number;
    chatType: string;
    updateId: number;
    messageId: number;
    userId?: number;
    username?: string;
  };
  assistant: {
    model: string;
  };
  events: AssistantTrajectoryEvent[];
  failure?: {
    stage: string;
    error: SerializedTrajectoryError;
  };
}

export type AssistantTrajectoryEventObserver = (
  event: AssistantTrajectoryEventData,
) => Promise<void> | void;

export interface AssistantTrajectoryRecorder {
  readonly trajectoryId: string;
  readonly filePath: string;
  record(event: AssistantTrajectoryEventData): Promise<void>;
  succeed(): Promise<void>;
  fail(stage: string, error: unknown): Promise<void>;
}
