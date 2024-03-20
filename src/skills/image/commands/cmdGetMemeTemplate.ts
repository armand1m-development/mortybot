import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdGetMemeTemplate: CommandMiddleware<BotContext> = (ctx) => {
  const templateName = ctx.match;

  if (ctx.session.memeTemplates.has(templateName)) {
    const template = ctx.session.memeTemplates.get(templateName);
    return ctx.reply("```json\n" + JSON.stringify(template, null, 2) + "```", {
      parse_mode: "Markdown",
    });
  }

  return ctx.reply("Meme template not found.");
};
