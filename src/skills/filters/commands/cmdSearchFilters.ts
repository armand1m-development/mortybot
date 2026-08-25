import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import {
  formatFilterMatches,
  parseFilterQuery,
  searchFilters,
} from "../utilities/searchFilters.ts";

/**
 * Searches filters instead of listing them: chats carry hundreds of filters,
 * so a question about a few of them should not dump — or make the assistant
 * read — the whole index. Replies with the best matches ranked by relevance;
 * when the assistant runs it as a tool with delivery suppressed, the same
 * text is what the model inspects.
 */
export const cmdSearchFilters: CommandMiddleware<BotContext> = async (ctx) => {
  const query = (typeof ctx.match === "string" ? ctx.match : "").trim();

  if (query.length === 0) {
    await ctx.reply(ctx.t("filters.search.missingArgument"));
    return;
  }

  const parsed = parseFilterQuery(query);
  if (parsed.includes.length === 0) {
    await ctx.reply(ctx.t("filters.search.missingArgument"));
    return;
  }

  const { matches, scanned } = searchFilters(ctx.session.filters, parsed);

  if (matches.length === 0) {
    await ctx.reply(ctx.t("filters.search.noMatches", { query }));
    return;
  }

  await ctx.reply(formatFilterMatches(matches, scanned, query));
};
