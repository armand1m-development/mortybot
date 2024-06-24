import type { Middleware } from "grammy/composer.ts";
import type { Filter } from "grammy/filter.ts";
import type { BotContext } from "/src/context/mod.ts";
import { createMemberMention } from "/src/utilities/createMemberMention.ts";
import { getChunks } from "/src/utilities/array/getChunks.ts";
import { parseHashtags } from "../utilities/parseHashtags.ts";

export const hashtagMentionListener: Middleware<
  Filter<BotContext, "message:text">
> = async (ctx) => {
  const hashtags = parseHashtags(ctx.msg.text).slice(0, 4);

  const result = { handled: false };

  for (const hashtag of hashtags) {
    const hashtagChannel = ctx.session.hashtagChannels.get(hashtag);

    if (!hashtagChannel) {
      continue;
    }

    const mentions = await Promise.all(
      hashtagChannel.participants
        .filter((userId) => userId !== ctx.msg.from.id)
        .map(async (userId) => {
          const { user } = await ctx.getChatMember(userId);
          const mention = createMemberMention(user, false);
          return mention;
        }),
    );

    const mentionChunks = getChunks(mentions);

    if (mentionChunks.length > 0) {
      result.handled = true;
    }

    for (const mentionChunk of mentionChunks) {
      const message = `
${hashtag}: ${mentionChunk.join(",")}
`;
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_to_message_id: ctx.msg.message_id,
      });
    }
  }

  return result;
};
