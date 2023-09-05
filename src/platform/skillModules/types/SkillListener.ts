import { Middleware } from "grammy/composer.ts";
import { Filter, FilterQuery } from "grammy/filter.ts";
import { Chat } from "grammy/types.ts";
import { BotContext } from "/src/context/mod.ts";

export interface SkillListener<Q extends FilterQuery> {
  event: Q | Q[];
  description: string;
  handler: Middleware<Filter<BotContext, Q>>;
  chatType?: Chat["type"];
}
