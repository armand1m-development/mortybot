import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import { getInitialGoodbyeCounterSessionData } from "./sessionData/getInitialGoodbyeCounterSessionData.ts";
import { goodbyeListener } from "./listeners/goodbyeListener.ts";

export const name: SkillModule["name"] = "goodbye";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [];

export const sessionDataInitializers: SkillModule["sessionDataInitializers"] = [
  getInitialGoodbyeCounterSessionData,
];

export const listeners: SkillModule["listeners"] = [
  <SkillListener<":left_chat_member">> {
    event: ":left_chat_member",
    description:
      "This listener checks when someone leaves the group and adds to a counter",
    handler: goodbyeListener,
  },
];
