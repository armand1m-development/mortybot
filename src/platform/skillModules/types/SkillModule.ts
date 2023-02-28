import { MiddlewareFn } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { SkillCommand } from "./SkillCommand.ts";
import { SkillListener } from "./SkillListener.ts";

export interface SkillModule {
  name: string;
  middlewares: (() => MiddlewareFn<BotContext>)[];
  commands: SkillCommand[];
  sessionDataInitializers: (() => Record<string, any>)[];
  listeners: SkillListener<any>[];
}
