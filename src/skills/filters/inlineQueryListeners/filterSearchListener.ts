import { InlineQueryMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { mapFilterToInlineQueryResult } from "../utilities/mapFilterToInlineQueryResult.ts";
// import Fuse from "fuse";
// import { Filter } from "../sessionData/types.ts";

// interface FuseResult<T> {
//   item: T;
//   refIndex: number;
// }
// interface FuseOptions {
//   isCaseSensitive?: boolean;
//   includeScore?: boolean;
//   shouldSort?: boolean;
//   includeMatches?: boolean;
//   findAllMatches?: boolean;
//   minMatchCharLength?: number;
//   location?: number;
//   threshold?: number;
//   distance?: number;
//   useExtendedSearch?: boolean;
//   ignoreLocation?: boolean;
//   ignoreFieldNorm?: boolean;
//   fieldNormWeight?: number;
//   keys: string[];
// }

const maxResults = 20;

export const filterSearchListener: InlineQueryMiddleware<BotContext> = async (
  ctx,
) => {
  const { query } = ctx.inlineQuery;

  const chatMember = await ctx.api.getChatMember(
    ctx.configuration.inlineQuerySourceChatId,
    ctx.update.inline_query.from.id,
  );

  const filters = [...ctx.session.filters.values()];
  const allowedStatuses = ["creator", "administrator", "member"];
  const answerOptions = { cache_time: 1, is_personal: true };

  if (!allowedStatuses.includes(chatMember.status)) {
    return ctx.answerInlineQuery([], answerOptions);
  }

  if (query.trim() === "") {
    const allFilters = filters
      .map(mapFilterToInlineQueryResult)
      .slice(0, maxResults);

    return ctx.answerInlineQuery(allFilters, answerOptions);
  }

  // const options: FuseOptions = {
  //   isCaseSensitive: false,
  //   threshold: 0.6,
  //   distance: 9,
  //   keys: [
  //     "filterTrigger",
  //   ],
  // };
  // const fuse = new Fuse(filters, options);
  // const result = fuse.search(query, { limit: 5 }) as FuseResult<Filter>[];
  // const answer = result
  //   .map(({ item }) => mapFilterToInlineQueryResult(item))
  //   .slice(0, maxResults);

  const answer = filters
    .filter((filter) =>
      filter.filterTrigger.toLowerCase().includes(query.toLowerCase())
    )
    .map((filter) => mapFilterToInlineQueryResult(filter))
    .slice(0, maxResults);

  return ctx.answerInlineQuery(answer, answerOptions);
};
