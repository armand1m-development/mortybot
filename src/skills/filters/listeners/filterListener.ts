import { getLogger } from "std/log/mod.ts";
import { Middleware } from "grammy/composer.ts";
import { Filter } from "grammy/filter.ts";
import { intersect } from "/src/utilities/set/intersect.ts";
import { BotContext } from "/src/context/mod.ts";

const logger = () => getLogger();

export const filterListener: Middleware<Filter<BotContext, "message:text">> =
  async (ctx) => {
    const text: string = ctx.msg.text;
    const words = new Set(text.split(" "));

    const filterEntries = Object.fromEntries(ctx.session.filters);
    const filterTriggers = new Set(Object.keys(filterEntries));

    const intersection = intersect(words, filterTriggers);

    logger().debug({
      text,
      words,
      filterTriggers,
      intersection,
    });

    if (intersection.length > 0) {
      const keyword = intersection[0];
      const filterMessage = ctx.session.filters.get(keyword)!;
      const caption = filterMessage.message.caption;

      if (filterMessage.message.video) {
        const { fileId } = filterMessage.message.video;
        return ctx.replyWithVideo(fileId, { caption });
      }

      if (filterMessage.message.audio) {
        const { fileId } = filterMessage.message.audio;
        return ctx.replyWithAudio(fileId, { caption });
      }

      if (filterMessage.message.image) {
        const { fileId } = filterMessage.message.image;
        return ctx.replyWithPhoto(fileId, { caption });
      }

      if (!caption) {
        return;
      }

      await ctx.reply(caption);
    }
  };
