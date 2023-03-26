import { getLogger } from "std/log/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { format, relative, resolve } from "std/path/posix.ts";
import { BotContext } from "/src/context/mod.ts";
import { extensionsByType } from "std/media_types/mod.ts";
import { downloadMessage } from "../utilities/downloadMessage.ts";

interface CommandFactoryProps {
  isLoud: boolean;
}

type CommandFactory = (
  props: CommandFactoryProps,
) => CommandMiddleware<BotContext>;

export const createAddFilterCommand: CommandFactory = ({
  isLoud,
}) =>
async (ctx) => {
  const filterTrigger = ctx.match;

  if (!filterTrigger) {
    return ctx.reply(
      "You should give me a filter to use. Example: `/add_filter !myfilter`",
    );
  }

  const filePath = resolve(
    ctx.configuration.dataPath,
    "./downloads",
  );

  const repliedMessage = (ctx.msg ?? ctx.update.message).reply_to_message;

  if (!repliedMessage) {
    getLogger().error("Failed to find reply_to_message");
    getLogger().debug({
      ctxMsg: ctx.msg,
      ctxUpdateMessage: ctx.update.message,
    });
    return ctx.reply("You should run this command when replying to a message.");
  }

  const downloadFile = async (fileId: string, mimeType?: string) => {
    try {
      const file = await ctx.api.getFile(fileId);

      const downloadFileName = format({
        name: fileId,
        ext: mimeType ? "." + extensionsByType(mimeType)![0] : undefined,
      });

      const downloadedPath = await file.download(
        resolve(filePath, downloadFileName),
      );

      return relative(ctx.configuration.dataPath, downloadedPath);
    } catch (err) {
      getLogger().debug(
        "Failed to download file. This is a best effort non blocking operation.",
      );
      getLogger().error(err);
    }
  };

  ctx.session.filters.set(filterTrigger, {
    filterTrigger,
    active: true,
    ownerId: ctx.message!.from.id,
    message: await downloadMessage(repliedMessage, downloadFile),
    isLoud: isLoud,
  });

  await ctx.reply("Filter is added");
};
