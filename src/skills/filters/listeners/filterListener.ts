import { getLogger } from "std/log/mod.ts";
import { Middleware } from "grammy/composer.ts";
import { Filter } from "grammy/filter.ts";
import { intersect } from "/src/utilities/set/intersect.ts";
import { BotContext } from "/src/context/mod.ts";

const logger = () => getLogger();

export const filterListener: Middleware<Filter<BotContext, "message:text">> = (
  ctx,
) => {
  const text: string = ctx.msg.text;
  const words = new Set(text.split(" "));

  const filterEntries = Object.fromEntries(ctx.session.filters);
  const filterTriggers = new Set(Object.keys(filterEntries));

  const intersection = intersect(words, filterTriggers).filter((trigger) => {
    const filterMessage = ctx.session.filters.get(trigger)!;
    return filterMessage.active;
  });

  logger().debug({
    user: ctx.msg.from,
    text,
    words,
    filterTriggers,
    intersection,
  });

  if (intersection.length > 0) {
    intersection.forEach(async (keyword) => {
      const filterMessage = ctx.session.filters.get(keyword)!;
      const caption = filterMessage.message.caption;

      if (filterMessage.message.video) {
        const { fileId } = filterMessage.message.video;
        await ctx.replyWithVideo(fileId, { caption });
        return;
      }

      if (filterMessage.message.audio) {
        const { fileId } = filterMessage.message.audio;
        await ctx.replyWithAudio(fileId, { caption });
        return;
      }

      if (filterMessage.message.image) {
        const { fileId } = filterMessage.message.image;
        await ctx.replyWithPhoto(fileId, { caption });
        return;
      }

      if (!caption) {
        return;
      }

      await ctx.reply(caption);
    });
  }
};
