import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import { tagMentionListener } from "./listeners/tagMention.ts";
import { cmdJoin } from "./commands/cmdJoin.ts";
import { getInitialTagChannelSessionData } from "./sessionData/getInitialTagChannelSessionData.ts";

export const name: SkillModule["name"] = "hashtags";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [
  {
    command: "join_hashtag",
    aliases: [],
    description: "Join hashtag channel and get notified",
    handler: cmdJoin,
  },
];
export const sessionDataInitializers: SkillModule["sessionDataInitializers"] = [
  getInitialTagChannelSessionData,
];

export const listeners: SkillModule["listeners"] = [
  <SkillListener<"message:text">> {
    event: "message:text",
    description:
      "Listens to a hashtag and mentions the people registered on it.",
    handler: tagMentionListener,
  },
];
