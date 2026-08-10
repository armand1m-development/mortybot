import * as queryString from "querystring";
import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import type { CommandInput } from "../types/mod.ts";
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
    return ctx.reply(ctx.t("image.invalidMemeInput"));
  }

  const templates = ctx.session.memeTemplates;
  const template = templates.get(commandInput.templateId);

  if (!template) {
    return ctx.reply(ctx.t("image.invalidTemplate", {
      templates: [...templates.keys()].join(", "),
    }));
  }

  const meme = await renderMeme({
    commandInput,
    template,
    debug,
    ctx,
  });

  await ctx.replyWithPhoto(meme);
};
