import type {
  AssistantTurnResult,
  OpenAiMessage,
  OpenAiTool,
} from "../../httpClients/types.ts";
import type { AssistantTrajectoryEventObserver } from "../../trajectory/types.ts";

export interface AssistantApiContext {
  assistantApi: {
    tools: OpenAiTool[];
    ask: (
      messages: OpenAiMessage[],
      options?: {
        onProgress?: (activity: string) => void;
        onPartial?: (partial: string) => void;
        onPartialDiscarded?: () => void;
        onTrajectoryEvent?: AssistantTrajectoryEventObserver;
      },
    ) => Promise<AssistantTurnResult>;
  };
}
