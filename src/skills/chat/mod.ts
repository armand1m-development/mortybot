import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";

export const name: SkillModule["name"] = "chat";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [
  {
    command: "set_title",
    aliases: ["batiza"],
    description: "Sets the chat title. Only works if the bot is a chat admin.",
    handler: async (ctx) => {
      const newChatTitle = ctx.match;

      if (!newChatTitle) {
        await ctx.reply(
          "Missing chat title. Usage: `/set_title new group title`",
        );
        return;
      }

      await ctx.setChatTitle(newChatTitle);
    },
  },
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];

export const listeners: SkillModule["listeners"] = [];

export const inlineQueryListeners: SkillModule["inlineQueryListeners"] = [];
