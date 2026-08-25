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
  /**
   * Whether the model may ask for this command's textual output as data
   * instead of having it posted to the chat. Adds a `deliver_to_chat`
   * parameter to the tool schema; when the model sets it to false, the
   * command's messages are captured and returned in the tool result so the
   * model can reason about them — for listings the user asks questions
   * about rather than wants dumped in full.
   */
  inspectable?: boolean;
  /**
   * Whether the command's output is a live snapshot of conditions right now —
   * a road camera, a live feed — and is stale the moment it is posted. Adds an
   * always-refetch directive to the tool's description: the model must call the
   * tool again for every request about present conditions instead of answering
   * from an earlier result quoted in the conversation history.
   */
  volatile?: boolean;
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
