import { getLogger } from "std/log/mod.ts";
import { Middleware } from "grammy/composer.ts";
import { Filter } from "grammy/filter.ts";
import { BotContext } from "/src/context/mod.ts";
import { replyFilter } from "../utilities/replyFilter.ts";
import { parseFilterMatches } from "../utilities/parseFilterMatches.ts";

const logger = () => getLogger();

export const filterListener: Middleware<Filter<BotContext, "message:text">> =
  async (
    ctx,
  ) => {
    const text = ctx.msg.text;
    const {
      words,
      matches,
      intersection,
      isExactMatch,
      filterTriggers,
      commandsFoundInText,
    } = parseFilterMatches(text, ctx.session);

    logger().debug({
      user: ctx.msg.from,
      text,
      words,
      filterTriggers,
      intersection,
      isExactMatch,
      commandsFoundInText,
      matchesSize: matches.size,
    });

    if (isExactMatch) {
      return replyFilter(text, ctx);
    }

    const promises = Array.from(matches).map((match) => {
      return replyFilter(match, ctx);
    });

    await Promise.allSettled(promises);
  };
