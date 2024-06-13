import * as queryString from "querystring";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { CommandInput } from "../types/mod.ts";
import { renderMeme } from "../utilities/renderMeme.ts";

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

  const meme = await renderMeme({
    commandInput,
    template,
    debug,
    ctx,
  });

  await ctx.replyWithPhoto(meme);
};
