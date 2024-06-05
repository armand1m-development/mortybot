import * as queryString from "querystring";
import { InputFile } from "grammy/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { renderer } from "../renderer/mod.ts";

interface CommandInput {
  templateId: string;
  texts: queryString.ParsedQuery;
}

function parseCommandInput(input: string): CommandInput | null {
  const components = input.split(" ");
  const templateId = components.shift()!;
  const queryParams = components.join(" ");
  const texts = queryString.parse(queryParams);

  return {
    templateId,
    texts,
  };
}

export const cmdCreateMeme: CommandMiddleware<BotContext> = async (ctx) => {
  const debug = ctx.session.enableMemeTemplateDebug;
  const commandInput = parseCommandInput(ctx.match);

  if (!commandInput) {
    return ctx.reply(
      "Invalid input. Please use the following format: `/meme templateId top=first text&bottom=second text&balloon=third` and so on",
    );
  }

  const templates = ctx.session.memeTemplates;
  const template = templates.get(commandInput.templateId);

  if (!template) {
    return ctx.reply(
      "You provided an invalid template name. Please use one of the following: \n" +
        Object.keys(templates).join(", "),
    );
  }

  const uniqueParams = new Set(template.params.map((param) => param.name));
  const isAvatarParamOnly = uniqueParams.size === 1 &&
    uniqueParams.has("avatar");

  if (
    Object.values(commandInput.texts).length !== uniqueParams.size &&
    !isAvatarParamOnly
  ) {
    return ctx.reply(
      `You provided an incorrect number of params for this template. Please provide the following params fo.`,
    );
  }

  const getAvatarBuffer = async () => {
    const replyMessage = ctx.msg.reply_to_message;
    const userId = replyMessage?.from?.id;

    if (userId !== undefined) {
      const userAvatar = await ctx.api.getUserProfilePhotos(userId);

      if (userAvatar.total_count === 0) {
        return null;
      }

      const photoSizes = userAvatar.photos[0];
      const highestResAvatar = photoSizes[photoSizes.length - 1];
      const file = await ctx.api.getFile(highestResAvatar.file_id);
      const url = file.getUrl();
      const avatarResponse = await fetch(url);
      const avatarBuffer = await avatarResponse.arrayBuffer();

      return avatarBuffer;
    }

    return null;
  };

  const avatarBuffer: ArrayBuffer | null = await getAvatarBuffer();
  const response = await fetch(template.url);
  const imageBuffer = await response.arrayBuffer();
  const image = await renderer({
    buffer: imageBuffer,
    avatarBuffer,
    params: template.params,
    texts: commandInput.texts,
    debug,
  });

  await ctx.replyWithPhoto(new InputFile(image));
};
