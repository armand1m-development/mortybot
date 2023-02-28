# Skills Domain

Skills are meant to hold all the implementation details for functionalities offered by Morty Bot.

Skills are essentially Typescript modules that export methods that can hook into the loading lifecycles.

## Empty Skill Template

```ts
import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { SkillListener } from "/src/platform/skillModules/types/SkillListener.ts";

export const name: SkillModule["name"] = "new-awesome-skill";
export const initializers: SkillModule["initializers"] = [];
export const middlewares: SkillModule["middlewares"] = [];
export const commands: SkillModule["commands"] = [];
export const sessionDataInitializers: SkillModule["sessionDataInitializers"] = [];
export const listeners: SkillModule["listeners"] = [
  <SkillListener<"message:text">> {
    event: "message:text",
    description: "Message based listener",
    handler: (ctx) => {},
  },
];
```

 