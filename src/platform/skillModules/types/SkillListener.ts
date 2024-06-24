import type { Middleware } from "grammy/composer.ts";
import type { Filter, FilterQuery } from "grammy/filter.ts";
import type { Chat } from "grammy/types.ts";
import type { BotContext } from "/src/context/mod.ts";

export interface SkillListener<Q extends FilterQuery> {
  event: Q | Q[];
  description: string;
  handler: Middleware<Filter<BotContext, Q>>;
  chatType?: Chat["type"];
}
