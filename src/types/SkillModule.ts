import { MiddlewareFn } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { SkillCommand } from "/src/types/SkillCommand.ts";

export interface SkillModule {
  name: string;
  middlewares: (() => MiddlewareFn<BotContext>)[];
  commands: SkillCommand[];
}
