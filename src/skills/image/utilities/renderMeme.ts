import { CommandContext } from "grammy/context.ts";
import { renderer } from "../renderer/mod.ts";
import { MemeTemplateEntry } from "../sessionData/types.ts";
import { CommandInput } from "../types/mod.ts";
import { BotContext } from "/src/context/mod.ts";
import { getUserAvatarBuffer } from "./getUserAvatarBuffer.ts";
import { InputFile } from "grammy/mod.ts";

export interface RenderMemeProps {
  commandInput: CommandInput;
  template: MemeTemplateEntry;
  debug: boolean;
  ctx: CommandContext<BotContext>;
}

export const renderMeme = async ({
  commandInput,
  template,
  debug,
  ctx,
}: RenderMemeProps) => {
  const uniqueParams = new Set(template.params.map((param) => param.name));
  const isAvatarParamOnly = uniqueParams.size === 1 &&
    uniqueParams.has("avatar");

  const hasMissingParams =
    Object.values(commandInput.texts).length !== uniqueParams.size;

  if (
    hasMissingParams &&
    !isAvatarParamOnly
  ) {
    const message =
      `You provided an incorrect number of params for this template. Please provide the following params: \n` +
      [...uniqueParams].join(", ");

    throw new Error(message);
  }

  const avatarBuffer: ArrayBuffer | null = await getUserAvatarBuffer(ctx);
  const response = await fetch(template.url);
  const imageBuffer = await response.arrayBuffer();
  const image = await renderer({
    imageBuffer,
    avatarBuffer,
    params: template.params,
    texts: commandInput.texts,
    debug,
  });

  return new InputFile(image);
};
