# Skill Modules

This folder keeps all the loaders and scanners of the project.

The SkillModulesLoader parses the `skills/skills.ts` file and goes over
importing every single module and placing every property into the bot context.

It also makes sure that certain things are executed before the modules are
loaded. _(some skills might need specific directory structures setup before they
are loaded, or more enhanced flows)_

It wraps every command and listener with proper tracing so that analysis can be
done on most used commands and command duration as well as listener invocation
and duration.

It also builds the command documentation to be sent to telegram and reports it
during startup.

## Debugging

There are some special env vars that can be used for debugging:

- `PRINT_SKILL_LOADING_REPORT=true` wilh print a very big skill loading report
  json during the startup, which can be used to verify if issues happened
  loading specific skills.
- `PRINT_BOT_COMMAND_DOCS_REPORT=true` will print a json object with all
  commands and descriptions being sent to telegram.
