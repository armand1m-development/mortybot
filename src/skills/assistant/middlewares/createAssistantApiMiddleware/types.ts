import type {
  AssistantTurnResult,
  OpenAiMessage,
  OpenAiTool,
} from "../../httpClients/types.ts";
import type { AssistantTrajectoryEventObserver } from "../../trajectory/types.ts";

/** Progress and trajectory callbacks for one assistant `ask` call. */
export interface AssistantAskOptions {
  onProgress?: (activity: string) => void;
  onPartial?: (partial: string) => void;
  onPartialDiscarded?: () => void;
  onTrajectoryEvent?: AssistantTrajectoryEventObserver;
}

export interface AssistantApiContext {
  assistantApi: {
    tools: OpenAiTool[];
    ask: (
      messages: OpenAiMessage[],
      options?: AssistantAskOptions,
    ) => Promise<AssistantTurnResult>;
  };
}
