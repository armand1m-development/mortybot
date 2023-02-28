import { Middleware } from "grammy/composer.ts";
import { Filter, FilterQuery } from "grammy/filter.ts";
import { BotContext } from "/src/context/mod.ts";

export interface SkillListener<Q extends FilterQuery> {
  event: Q;
  description: string;
  handler: Middleware<Filter<BotContext, Q>>;
}
