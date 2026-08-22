import type { OpenAiMessage } from "../httpClients/types.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const sanitizeHistory = (messages: OpenAiMessage[]): OpenAiMessage[] =>
  messages
    .map((message) => {
      const content: unknown = message.content;

      if (typeof content === "string" || content === null) {
        return message;
      }

      if (isRecord(content) && typeof content.content === "string") {
        return { ...message, content: content.content };
      }

      return null;
    })
    .filter((message): message is OpenAiMessage => message !== null);
