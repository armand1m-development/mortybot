import { MiddlewareFn } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";
import { SkillCommand } from "./SkillCommand.ts";
import { SkillListener } from "./SkillListener.ts";

export interface SkillModule {
  name: string;
  middlewares: (() => MiddlewareFn<BotContext>)[];
  commands: SkillCommand[];
  // deno-lint-ignore no-explicit-any
  sessionDataInitializers: (() => Record<string, any>)[];
  // deno-lint-ignore no-explicit-any
  listeners: SkillListener<any>[];
  /**
   * This is a place for you to add functions to
   * be triggered when this skill is loaded.
   *
   * You can do things like create folders, for example.
   */
  initializers: (() => Promise<void> | void)[];
}
