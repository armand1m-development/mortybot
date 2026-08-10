import type { Middleware } from "grammy";
import type { Filter, FilterQuery } from "grammy";
import type { Chat } from "grammy/types";
import type { BotContext } from "/src/context/mod.ts";

export interface SkillListener<Q extends FilterQuery> {
  event: Q | Q[];
  description: string;
  handler: Middleware<Filter<BotContext, Q>>;
  chatType?: Chat["type"];
}
