import { getLogger } from "std/log/mod.ts";
import { Middleware } from "grammy/composer.ts";
import { Filter } from "grammy/filter.ts";
import { BotContext } from "/src/context/mod.ts";

const extractUrls = (text: string) => {
  const regex = /\bhttps?:\/\/\S+\b/g;
  const matches = [...text.matchAll(regex)].map(match => match[0]);
  return matches;
}; 

const isInstagramLink = (url: string) => {
  const instagramRegex = /^https:\/\/(www\.)?instagram\.com\/(p\/\w+|[^/]+)\/?$/;
  return instagramRegex.test(url);
}

export const instagramExpanderListener: Middleware<Filter<BotContext, "message:text">> =
  async (
    ctx,
  ) => {
    const isEnabled = ctx.session.expanders.enabled;

    if (!isEnabled) {
      return;
    }

    const text = ctx.msg.text;
    const urls = extractUrls(text);

    getLogger().debug({
      text,
      urls
    });

    for (const url of urls) {
      if (!isInstagramLink(url)) {
        continue;
      }
    
      await ctx.reply(`Found an insta link: ${url}`);

      const { reel, photo } = await fetchInstagramMetadata(url);

      if (reel) {
        await ctx.replyWithVideo(reel.buffer, {
          caption: reel.caption,
          reply_to_message_id: ctx.msg.message_id,
        });
        continue;
      }

      if (photo) {
        await ctx.replyWithPhoto(photo.buffer, {
          caption: photo.caption,
          reply_to_message_id: ctx.msg.message_id,
        });
        continue;
      }
    }
  };
