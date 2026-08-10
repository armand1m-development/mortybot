import type { CommandMiddleware } from "grammy";
import type { Chat } from "grammy/types";
import type { BotContext } from "/src/context/mod.ts";

export interface SkillCommand {
  command: string;
  aliases: string[];
  description: string;
  handler: CommandMiddleware<BotContext>;
  middlewares?: CommandMiddleware<BotContext>[];
  chatType?: Chat["type"][];
}
