import type { MiddlewareFn } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import { askAssistant } from "../../httpClients/askAssistant.ts";
import type { OpenAiMessage, OpenAiTool } from "../../httpClients/types.ts";
import { getMcpRegistry } from "../../mcp/registry.ts";
import {
  callBuiltinAssistantTool,
  getBuiltinAssistantTools,
} from "../../tools/builtinTools.ts";
import { createToolConfirmation } from "../../utilities/toolConfirmations.ts";
import { describeDeliveredMedia } from "../../vision/describeChatMedia.ts";

interface CachedTools {
  botTools: OpenAiTool[];
  mcpTools: OpenAiTool[];
  builtinTools: OpenAiTool[];
  merged: OpenAiTool[];
}

export const createAssistantApiMiddleware = () => {
  /**
   * Merged tool arrays per chat type. The registries hand back the same array
   * instance until their tools actually change, so a reference check is enough
   * to know the merge is still current — and reusing the instance keeps the
   * serialized tool block byte-identical across turns, which is what makes the
   * inference server's prefix cache hit.
   */
  const toolCache = new Map<string, CachedTools>();

  const mergeTools = (
    botTools: OpenAiTool[],
    mcpTools: OpenAiTool[],
    builtinTools: OpenAiTool[],
    chatType: string,
  ): OpenAiTool[] => {
    const cached = toolCache.get(chatType);
    if (
      cached && cached.botTools === botTools && cached.mcpTools === mcpTools &&
      cached.builtinTools === builtinTools
    ) {
      return cached.merged;
    }

    const botToolNames = new Set(botTools.map((tool) => tool.function.name));
    const merged = [
      ...botTools,
      ...mcpTools.filter((tool) => !botToolNames.has(tool.function.name)),
      ...builtinTools,
    ];
    toolCache.set(chatType, { botTools, mcpTools, builtinTools, merged });

    return merged;
  };

  const middleware: MiddlewareFn<BotContext> = (ctx, next) => {
    const {
      openAiBaseUrl,
      openAiModel,
      openAiApiKey,
      assistantStreamIdleTimeoutMs,
      assistantMaxTurnDurationMs,
      assistantTemperature,
      assistantMaxTokens,
      assistantThinking,
    } = ctx.configuration;
    const registry = getMcpRegistry();
    const tools = mergeTools(
      ctx.skillCommandTools.getOpenAiTools(ctx.chat?.type),
      registry.getOpenAiTools(),
      getBuiltinAssistantTools(),
      ctx.chat?.type ?? "*",
    );

    ctx.assistantApi = {
      tools,
      ask: (messages: OpenAiMessage[], options) => {
        let pendingConfirmationId: string | undefined;
        return askAssistant({
          token: openAiApiKey,
          baseUrl: openAiBaseUrl,
          model: openAiModel,
          messages,
          tools,
          temperature: assistantTemperature,
          maxTokens: assistantMaxTokens,
          thinking: assistantThinking,
          idleTimeoutMs: assistantStreamIdleTimeoutMs,
          maxDurationMs: assistantMaxTurnDurationMs,
          // MCP tools only fetch data, so several can run at once. Bot command
          // tools post their own messages into the chat and may queue a
          // confirmation, so they stay in order.
          isConcurrencySafe: (name) => !ctx.skillCommandTools.has(name),
          callTool: async (name, args) => {
            const builtin = callBuiltinAssistantTool(name);
            if (builtin) {
              return builtin;
            }

            if (!ctx.skillCommandTools.has(name)) {
              return registry.callTool(name, args);
            }

            let call;
            try {
              call = ctx.skillCommandTools.prepare(name, args, ctx.chat?.type);
            } catch (error) {
              return {
                text: error instanceof Error
                  ? error.message
                  : "The bot command arguments were invalid.",
                sources: [],
              };
            }

            if (call.effect === "write") {
              if (pendingConfirmationId) {
                return {
                  text:
                    "Another state-changing bot action is already awaiting confirmation for this request. Do not call more write tools.",
                  sources: [],
                  confirmationId: pendingConfirmationId,
                };
              }
              const confirmation = createToolConfirmation(ctx, call);
              pendingConfirmationId = confirmation.id;
              return {
                text:
                  `/${call.command} requires explicit user approval. Explain the pending action briefly and ask the user to use the Confirm or Cancel button. Do not claim that it already ran.`,
                sources: [],
                confirmationId: confirmation.id,
              };
            }

            return await ctx.skillCommandTools.execute(ctx, call, {
              // A command that posts pictures has told the user something the
              // model cannot see. Looking at them here is what lets the same
              // turn answer "so is it busy right now?".
              onMediaSent: (messages, command, description) => {
                options?.onProgress?.("looking at the pictures");
                return describeDeliveredMedia(
                  ctx,
                  messages,
                  command,
                  description,
                );
              },
            });
          },
          onProgress: options?.onProgress,
          onPartial: options?.onPartial,
          onPartialDiscarded: options?.onPartialDiscarded,
          onTrajectoryEvent: options?.onTrajectoryEvent,
        });
      },
    };

    return next();
  };

  return middleware;
};
