# Skills Domain

Skills are meant to hold all the implementation details for functionalities
offered by Morty Bot.

Skills are essentially Typescript modules that export methods that can hook into
the loading lifecycles.

## Empty Skill Template

- Create a folder with the name of your skill module
- Add a `mod.ts` file with the content below

```ts
import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";

// TODO for new skill module: rename to proper skill module name
export const name: SkillModule["name"] = "new-awesome-skill";

// Initializers are functions that get run before your skill gets loaded.
export const initializers: SkillModule["initializers"] = [];

// Middlewares can be used for authentication or dependency injection
// into the BotContext
export const middlewares: SkillModule["middlewares"] = [];

// Commands should be defined here with their handlers.
// This object will be used to generate the command docs
// during startup as well.
export const commands: SkillModule["commands"] = [];

// Session Data Initializers are objects that represent
// the empty state of your skill module session objects.
//
// These will get merged with the other skills objects as well.
export const sessionDataInitializers: SkillModule["sessionDataInitializers"] =
  [];

/**
 * The code in the comments is an example
 * of strong typed listeners.
 *
 * You may leave this property empty if
 * you're not looking to add listeners
 * to your module.
 *
 * import { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
 *
 * export const listeners: SkillModule["listeners"] = [
 *   <SkillListener<"message:text">> {
 *     event: "message:text",
 *     description: "Message based listener",
 *     handler: (ctx) => {},
 *   },
 * ];
 */
export const listeners: SkillModule["listeners"] = [];
```

- Make sure to update the `skills.ts` file so your skill module gets loaded.

From here on you can implement these functionalities as you wish: be it in a
single file or multiple different files and directories. It will depend on how
complex your skill will be.

All of these should be type safe, so you should also get some nice
autocompletion to get started with.

Tip: refer to already implemented commands as examples.

## Updating the skills.ts file

Run `deno task generate:skills` from the project root.
