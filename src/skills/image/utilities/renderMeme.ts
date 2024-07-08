import type { CommandContext } from "grammy/context.ts";
import { renderer } from "../renderer/mod.ts";
import type { MemeTemplateEntry } from "../sessionData/types.ts";
import type { CommandInput } from "../types/mod.ts";
import type { BotContext } from "/src/context/mod.ts";
import { InputFile } from "grammy/mod.ts";
import { getUserAvatarBuffer } from "./getUserAvatarBuffer.ts";
import { getReplyImageBuffer } from "./getReplyImageBuffer.ts";
import { getStickerImageBuffer } from "./getStickerImageBuffer.ts";

export interface RenderMemeProps {
  commandInput: CommandInput;
  template: MemeTemplateEntry;
  debug: boolean;
  ctx: CommandContext<BotContext>;
}

const specialParams = ["avatar", "sticker", "replyPhoto", "overlay"];

export const renderMeme = async ({
  commandInput,
  template,
  debug,
  ctx,
}: RenderMemeProps) => {
  const filteredParams = template.params.filter((param) =>
    !specialParams.includes(param.name)
  );

  const uniqueParams = new Set(filteredParams.map((param) => param.name));

  const hasMissingParams =
    Object.values(commandInput.texts).length !== uniqueParams.size;

  if (
    hasMissingParams
  ) {
    const message =
      `You provided an incorrect number of params for this template. Please provide the following params: \n` +
      [...uniqueParams].join(", ");

    throw new Error(message);
  }

  const stickerImageBuffer = await getStickerImageBuffer(ctx);
  const replyImageBuffer = await getReplyImageBuffer(ctx);
  const avatarBuffer = await getUserAvatarBuffer(ctx);
  const response = await fetch(template.url);
  const templateImageBuffer = await response.arrayBuffer();
  const image = await renderer({
    templateImageBuffer,
    stickerImageBuffer,
    replyImageBuffer,
    avatarBuffer,
    params: template.params,
    filteredParams,
    texts: commandInput.texts,
    debug,
  });

  return new InputFile(image);
};
