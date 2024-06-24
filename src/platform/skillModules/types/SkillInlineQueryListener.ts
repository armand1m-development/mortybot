import type { InlineQueryMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";

export interface SkillInlineQueryListener {
  pattern: string | RegExp;
  handler: InlineQueryMiddleware<BotContext>;
  description?: string;
}
