import { getLogger } from "std/log/mod.ts";
import { Middleware } from "grammy/composer.ts";
import { Filter } from "grammy/filter.ts";
import { BotContext } from "/src/context/mod.ts";
import { replyFilter } from "../utilities/replyFilter.ts";
import {
  hasLoudMatches,
  isExactMatch,
} from "../utilities/parseFilterMatches.ts";

export const filterListener: Middleware<Filter<BotContext, "message:text">> =
  async (
    ctx,
  ) => {
    const text = ctx.msg.text;

    if (isExactMatch(text, ctx.session)) {
      await replyFilter(text, ctx);
      return { handled: true };
    }

    const { matches } = hasLoudMatches(text, ctx.session);

    if (matches.size === 0) {
      return { handled: false };
    }

    getLogger().debug({
      user: ctx.msg.from,
      text,
      matches,
    });

    for (const match of matches) {
      await replyFilter(match, ctx);
    }

    return { handled: true };
  };
