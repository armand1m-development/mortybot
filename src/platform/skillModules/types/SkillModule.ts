import type { Router } from "oak";
import type { Migrations } from "grammy/mod.ts";
import type { MiddlewareFn } from "grammy/composer.ts";
import type { Router as GrammyRouter } from "grammy_router/router.ts";
import type { BotContext } from "/src/context/mod.ts";
import type { SkillCommand } from "./SkillCommand.ts";
import type { SkillListener } from "./SkillListener.ts";
import type { SkillInlineQueryListener } from "./SkillInlineQueryListener.ts";
import { Configuration } from "./src/platform/configuration/middlewares/types.ts";

export interface SkillModule {
  /**
   * The name of the skill.
   * This name will be referenced throughout many uses in the application:
   * - application boot logs
   * - error logs
   * - telegram bot command descriptions
   * - route path prefixes
   *
   * It is recommended to use a name that is unique and easy to remember, preferably lowercase.
   */
  name: string;
  /**
   * Middlewares are functions that are executed before the main command or listener.
   *
   * They are useful for things like:
   * - checking if the user is an admin
   * - checking if the user has a certain permission
   * - checking if the user has a certain setting enabled
   * - instantiating a database connection or http client
   */
  middlewares: (() => MiddlewareFn<BotContext>)[];
  /**
   * List of the commands enabled by this skill.
   * Please make sure to give it an unique name and description.
   *
   * The loaders will *not* manage command name clashing.
   * You'll have to pay attention to that.
   */
  commands: SkillCommand[];
  /**
   * This is a place for you to add functions that
   * initialize the session state for your skill.
   *
   * These functions are usually used to set the initial state
   * of the session portion of the context relevant to this skill.
   */
  sessionDataInitializers:
    // deno-lint-ignore no-explicit-any
    ((configuration: Configuration) => Record<string, any>)[];
  /**
   * Listeners are functions that are executed when a certain event happens.
   *
   * This can be a message, a callback query, a poll answer, a user leaving the chat, etc.
   * They can be strongly typed. Refer to other examples in the codebase.
   */
  // deno-lint-ignore no-explicit-any
  listeners: SkillListener<any>[];
  /**
   * This is a place for you to add functions to
   * be triggered when this skill is loaded.
   *
   * You can do things like create folders, for example.
   */
  initializers: ((configuration: Configuration) => Promise<void> | void)[];
  /**
   * Inline Queries are a new feature supported by Telegram where you can send a query to the bot
   * without sending a message first, usually by typing `@botname query`.
   *
   * Mortybot supports it as well, and you can defined your skill query listeners on this key.
   */
  inlineQueryListeners: SkillInlineQueryListener[];
  /**
   * Migrations should be added here.
   *
   * Migrations are used to manage changes to the session data schema.
   * As they're persisted for every chat, changing/adding/removing fields can be disruptive.
   *
   * The migrations are run in order, so make sure to add them in the right order:
   *  - the key should always be the result of `Date.now()` when the migration was added.
   */
  migrations: Migrations;
  /**
   * The router is used to define routes for the skill.
   *
   * Routes are used to define HTTP endpoints that can be used to interact with the skill from outside of the bot.
   * You should instantiante oak's router and define the routes here.
   *
   * When loaded, the routes will be available prefixed by the skill name in the route path.
   */
  router: Router<Record<string, unknown>> | null;
  /**
   * Bot Routers are a feature provided by a grammy plugin for routers.
   * This feature can be used to direct users to specific behaviors and actions
   * given a specific input and state.
   */
  botRouters?: GrammyRouter<BotContext>[] | null;
}
