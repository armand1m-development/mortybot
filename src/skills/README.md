# Skills Domain

Skills are meant to hold all the implementation details for functionalities
offered by Morty Bot

They encapsulate all aspects of feature implementations within their own domains
as a way to keep things organized, separate, as well as easy for predicted use
cases.

There are a few situations where you might have to get out of your skill domain
to integrate it with the wider application _(e.g.: editing the
`/src/context/mod.ts` to include your skill session types in the overall bot
context type)_

## How skills work

Skills are scanned and loaded during the server boot.

Skills are essentially Typescript modules that export methods that can hook into
the loading lifecycles and they enable multiple features in the bot:

- Automatic bot registration
- Automatic command description generation and update
- Registering middlewares
- Running sideeffect functions before the commands are setup _(e.g.: creating a
  folder to store parsed files)_
- Registering message listeners for reactive replies _(used by the `filters`,
  `hashtags` and `goodbye` skills)_
- Exposing HTTP routes

### Getting started

Lets start with the most basic example: a new skill with a single command.

- Create a folder with the name of your skill and add the following code to
  `mod.ts`
- Run `deno task generate:skills`
- Your command should be registered and working.
- You should be able to see the command on telegram as well as in the server
  logs.

```ts
import { CommandMiddleware } from "grammy/composer.ts";
import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { BotContext } from "/src/context/mod.ts";

const cmdExample: CommandMiddleware<BotContext> = async (ctx) => {
  await ctx.reply("Hello world");
};

const skillModule: SkillModule = {
  name: "exampleskill",
  initializers: [],
  middlewares: [],
  commands: [
    {
      command: "sample",
      aliases: ["samp", "eg", "example"],
      description: "This is a very simple example of a very simple command.",
      handler: cmdExample,
      chatType: ["group", "supergroup"],
    },
  ],
  sessionDataInitializers: [],
  listeners: [],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
```

From here on you can implement these functionalities as you wish: be it in a
single file or multiple different files and directories. It will depend on how
complex your skill will be.

All of these should be type safe, so you should also get some nice
autocompletion to get started with.

_**Tip**: refer to already implemented commands as examples._

### Other examples

#### **A hug request listener through the hashtag #hug**

```ts
import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";
import { Middleware } from "grammy/composer.ts";
import { Filter } from "grammy/filter.ts";
import { BotContext } from "/src/context/mod.ts";

export const hugListener: Middleware<Filter<BotContext, "message:text">> =
  async (ctx) => {
    if (ctx.msg.text === "#hug") {
      await ctx.reply("A hug for you []");
      return { handled: true };
    }

    return { handled: false };
  };

const skillModule: SkillModule = {
  name: "hugs",
  initializers: [],
  middlewares: [],
  commands: [],
  sessionDataInitializers: [],
  listeners: [
    <SkillListener<"message:text">> {
      event: "message:text",
      description:
        "This listener checks and replies for hug requests through the #hug hashtag",
      handler: hugListener,
    },
  ],
  inlineQueryListeners: [],
  migrations: {},
  router: null,
};

export default skillModule;
```

#### **An exit counter with persistent data. Every time someone leaves the chat, increment the counter**

This one is slightly more annoying because, because you'll have to type and
initialize your section of the session store.

// TBD
