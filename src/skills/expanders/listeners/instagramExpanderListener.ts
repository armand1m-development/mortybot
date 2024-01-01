import { getLogger } from "std/log/mod.ts";
import { Filter } from "grammy/filter.ts";
import { Middleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { extractInstagramReel } from "../scrapers/extractInstagramReel.ts";
import { InstagramMediaMetadata } from "../sessionData/types.ts";

const extractUrls = (text: string) => {
  const regex = /\bhttps?:\/\/\S+\b/g;
  const matches = [...text.matchAll(regex)].map((match) => match[0]);
  return matches;
};

const isInstagramLink = (url: string) => {
  // TODO: better instagram link check, check for reel vs photo

  // const instagramRegex =
  //   /^https:\/\/(www\.)?instagram\.com\/(p\/\w+|[^/]+)\/?$/;
  // return instagramRegex.test(url);

  return url.startsWith("https://www.instagram.com")
};


const fetchInstagramMetadata = async (
  url: string,
): Promise<InstagramMediaMetadata> => {
  const { payload } = await extractInstagramReel(url);

  getLogger().debug({
    url,
    payload,
  });

  const result: InstagramMediaMetadata = {
    payload,
  };

  return result;
};

export const instagramExpanderListener: Middleware<
  Filter<BotContext, "message:text">
> = async (
  ctx,
) => {
  // TOOD: create migration first, add expandertoggle and uncomment this
  // const isEnabled = ctx.session.expanders.enabled;

  // if (!isEnabled) {
  //   return;
  // }

  const text = ctx.msg.text;
  const urls = extractUrls(text);

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
