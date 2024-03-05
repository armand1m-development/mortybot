import { InlineQueryMiddleware } from "grammy/composer.ts";
import { InlineQueryContext } from "grammy/context.ts";
import { BotContext } from "/src/context/mod.ts";
import { mapFilterToInlineQueryResult } from "../utilities/mapFilterToInlineQueryResult.ts";
import { mapAudioToInlineQueryResult } from "../utilities/mapAudioToInlineQueryResult.ts";

const maxResults = 20;
const allowedStatuses = ["creator", "administrator", "member"];
const answerOptions = { cache_time: 1, is_personal: true };

const isUserAllowed = async (ctx: InlineQueryContext<BotContext>) => {
  const chatMember = await ctx.api.getChatMember(
    ctx.configuration.inlineQuerySourceChatId,
    ctx.update.inline_query.from.id,
  );

  return allowedStatuses.includes(chatMember.status);
};

export const searchListener: InlineQueryMiddleware<BotContext> = async (
  ctx,
) => {
  const hasAccess = await isUserAllowed(ctx);

  if (!hasAccess) {
    return ctx.answerInlineQuery([], answerOptions);
  }

  const regex = /^(\w+)\s*(.*)$/;
  const match = ctx.inlineQuery.query.match(regex);
  const filters = [...ctx.session.filters.values()];

  if (match === null) {
    const answer = filters
      .map(mapFilterToInlineQueryResult)
      .slice(0, maxResults);

    return ctx.answerInlineQuery(answer, answerOptions);
  }

  let [, prefix, query] = match;

  if (prefix === "muminst") {
    if (query.trim() === "") {
      const audios = (ctx.session.audioDatabase ?? [])
        .map((audio) => mapAudioToInlineQueryResult(audio))
        .slice(0, maxResults);

      return ctx.answerInlineQuery(audios, answerOptions);
    }

    const audios = (ctx.session.audioDatabase ?? [])
      .filter((audio) => {
        try {
          return `${audio.name}`.toLowerCase().includes(query.toLowerCase());
        } catch (e) {
          console.error(`broken audio: ${JSON.stringify(audio)}`);
          throw e;
        }
      })
      .map((audio) => mapAudioToInlineQueryResult(audio))
      .slice(0, maxResults);

    return ctx.answerInlineQuery(audios, answerOptions);
  }

  query = prefix;

  if (query.trim() === "") {
    const answer = filters
      .map(mapFilterToInlineQueryResult)
      .slice(0, maxResults);

    return ctx.answerInlineQuery(answer, answerOptions);
  }

  const answer = filters
    .filter((filter) =>
      filter.filterTrigger.toLowerCase().includes(query.toLowerCase())
    )
    .map((filter) => mapFilterToInlineQueryResult(filter))
    .slice(0, maxResults / 2);

  return ctx.answerInlineQuery(answer, answerOptions);
};
