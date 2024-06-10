import { CommandMiddleware } from "grammy/composer.ts";
import { Chat } from "grammy/types.ts";
import { BotContext } from "/src/context/mod.ts";

export interface SkillCommand {
  command: string;
  aliases: string[];
  description: string;
  handler: CommandMiddleware<BotContext>;
  middlewares?: CommandMiddleware<BotContext>[];
  chatType?: Chat["type"][];
}
