import Fuse from "fuse";
import { InlineQueryMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { mapFilterToInlineQueryResult } from "../utilities/mapFilterToInlineQueryResult.ts";
import { Filter } from "../sessionData/types.ts";

interface FuseResult<T> {
  item: T;
  refIndex: number;
}

export const filterSearchListener: InlineQueryMiddleware<BotContext> = (
  ctx,
) => {
  const options = {
    isCaseSensitive: false,
    // includeScore: false,
    // shouldSort: true,
    // includeMatches: false,
    // findAllMatches: false,
    // minMatchCharLength: 1,
    // location: 0,
    // threshold: 0.6,
    // distance: 100,
    // useExtendedSearch: false,
    // ignoreLocation: false,
    // ignoreFieldNorm: false,
    // fieldNormWeight: 1,
    keys: [
      "filterTrigger",
      "message.caption",
    ],
  };

  const filters = [...ctx.session.filters.values()];
  const regex = /^(\w+)\s*(.*)$/;
  const match = ctx.inlineQuery.query.match(regex);

  if (match === null) {
    return;
  }

  const [, _commandPrefix, query] = match;

  if (query.trim() === "") {
    const allFilters = filters.map(mapFilterToInlineQueryResult);
    console.log({
      allFilters,
    });
    return ctx.answerInlineQuery(allFilters);
  }

  const fuse = new Fuse(filters, options);

  const result = fuse.search(query) as FuseResult<Filter>[];

  const answer = result.map(({ item }) => {
    return mapFilterToInlineQueryResult(item);
  });

  console.log({
    filters,
    query,
    answer,
  });

  return ctx.answerInlineQuery(answer);
};
