import type { CommandMiddleware } from "grammy";
import type { Chat } from "grammy/types";
import type { BotContext } from "/src/context/mod.ts";

export type SkillCommandToolEffect = "read" | "write";

export interface SkillCommandAssistantTool {
  /**
   * Read tools may run immediately. Write tools require an explicit
   * confirmation before their command handler is invoked.
   */
  effect: SkillCommandToolEffect;
  /** OpenAI-compatible JSON Schema for this command's natural-language tool. */
  parameters: Record<string, unknown>;
  /** Convert validated structured tool arguments to the command's ctx.match. */
  toCommandInput: (args: Record<string, unknown>) => string;
  /** Optional tool-only detail in addition to the command description. */
  description?: string;
}

export interface SkillCommand {
  command: string;
  aliases: string[];
  description: string;
  handler: CommandMiddleware<BotContext>;
  assistantTool: SkillCommandAssistantTool;
  middlewares?: CommandMiddleware<BotContext>[];
  chatType?: Chat["type"][];
}
