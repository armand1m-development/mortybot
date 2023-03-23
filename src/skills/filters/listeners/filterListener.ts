import { getLogger } from "std/log/mod.ts";
import { Middleware } from "grammy/composer.ts";
import { Filter } from "grammy/filter.ts";
import { intersect } from "/src/utilities/set/intersect.ts";
import { BotContext } from "/src/context/mod.ts";
import { replyFilter } from "../utilities/replyFilter.ts";

const logger = () => getLogger();

export const filterListener: Middleware<Filter<BotContext, "message:text">> =
  async (
    ctx,
  ) => {
    const text: string = ctx.msg.text;
    const words = new Set(text.split(" "));

    const filterEntries = Object.fromEntries(ctx.session.filters);
    const filterTriggers = new Set(Object.keys(filterEntries));

    const isActive = (trigger: string) => {
      const filterMessage = ctx.session.filters.get(trigger)!;
      return filterMessage.active;
    };

    const isLoud = (trigger: string) => {
      const filterMessage = ctx.session.filters.get(trigger)!;
      return filterMessage.isLoud === true;
    };

    const intersection = intersect(words, filterTriggers)
      .filter(isLoud)
      .filter(isActive);

    const commandsFoundInText = [...filterTriggers].filter((trigger) =>
      text.includes(trigger) && isActive(trigger) && isLoud(trigger)
    );

    const textMatchesFilter = ctx.session.filters.get(text);
    const isExactMatch = textMatchesFilter &&
      textMatchesFilter.isLoud === false;

    const matches = new Set([
      ...intersection,
      ...commandsFoundInText,
    ]);

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

    if (matches.size > 0) {
      await Promise.allSettled([...matches].map((match) => {
        return replyFilter(match, ctx);
      }));
    }
  };
