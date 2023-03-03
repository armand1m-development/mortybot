import { getLogger } from "std/log/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { parseHashtags } from "../utilities/parseHashtags.ts";

export const cmdJoin: CommandMiddleware<BotContext> = (ctx) => {
  const hashtags = parseHashtags(ctx.match);

  if (hashtags.length === 0) {
    ctx.reply("Tem que passa a hashtag");
    return;
  }

  hashtags.map((tagName) => {
    const channel = ctx.session.tagChannels.get(tagName);
    const userId = ctx.message!.from.id;

    if (channel?.participants.includes(userId)) {
      ctx.reply(`Voce ja esta no canal #${tagName}`);
      return;
    }

    if (!channel) {
      ctx.session.tagChannels.set(tagName, {
        participants: [userId],
        tagName,
      });
      return;
    }

    ctx.session.tagChannels.set(tagName, {
      participants: [...channel.participants, userId],
      tagName,
    });
  });
};
