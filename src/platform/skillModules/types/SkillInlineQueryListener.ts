import { InlineQueryMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export interface SkillInlineQueryListener {
  pattern: string | RegExp;
  handler: InlineQueryMiddleware<BotContext>;
}
