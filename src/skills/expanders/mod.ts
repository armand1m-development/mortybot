import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import { cmdToggleExpanders } from "./commands/cmdToggleExpanders.ts";
import { instagramExpanderListener } from "./listeners/instagramExpanderListener.ts";

export const name: SkillModule["name"] = "expanders";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [
  {
    command: "toggle_expanders",
    aliases: [],
    description: "Enable or disable link expanders in this group",
    handler: cmdToggleExpanders,
  },
];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];

export const listeners: SkillModule["listeners"] = [
  <SkillListener<"message:text">> {
    event: "message:text",
    description:
      "Extracts URLs from messages, filters for Instagram ones and fetches content to post in the chat",
    handler: instagramExpanderListener,
  },
];

export const inlineQueryListeners: SkillModule["inlineQueryListeners"] = [];
