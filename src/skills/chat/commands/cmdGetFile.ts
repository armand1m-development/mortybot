import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { InputFile } from "grammy/mod.ts";

export const cmdGetFile: CommandMiddleware<BotContext> = async (ctx) => {
  const replyMessage = ctx.msg.reply_to_message!;

  const getFileBuffer = async () => {
    const fileId = replyMessage?.sticker?.file_id ??
      replyMessage?.video_note?.file_id ?? replyMessage?.animation?.file_id;

    if (fileId !== undefined) {
      const file = await ctx.api.getFile(fileId);
      const url = file.getUrl();
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return { buffer, url };
    }

    return {
      buffer: null,
      url: null,
    };
  };

  const { buffer, url } = await getFileBuffer();

  if (!buffer) return ctx.reply("No image found.");
  const inputFile = new InputFile(new Uint8Array(buffer));

  if (replyMessage?.sticker !== undefined) {
    return ctx.replyWithPhoto(inputFile, {
      caption: url,
    });
  }

  if (replyMessage?.video_note !== undefined) {
    return ctx.replyWithVideo(inputFile, {
      caption: url,
    });
  }

  if (replyMessage?.animation !== undefined) {
    return ctx.replyWithVideo(inputFile, {
      caption: url,
    });
  }

  return ctx.reply(url);
};
