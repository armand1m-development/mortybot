import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import { tagMentionListener } from "./listeners/tagMention.ts";
import { cmdJoin } from "./commands/cmdJoin.ts";
import { getInitialTagChannelSessionData } from "./sessionData/getInitialTagChannelSessionData.ts";

export const name: SkillModule["name"] = "group-tag";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [
  {
    command: "join",
    aliases: [],
    description: "Join tag channel",
    handler: cmdJoin,
  },
];
export const sessionDataInitializers: SkillModule["sessionDataInitializers"] = [
  getInitialTagChannelSessionData,
];

export const listeners: SkillModule["listeners"] = [
  <SkillListener<"message:text">> {
    event: "message:text",
    description: "Listen to a tag mention",
    handler: tagMentionListener,
  },
];
