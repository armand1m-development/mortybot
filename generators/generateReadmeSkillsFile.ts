import { resolve } from "std/path/posix.ts";
import * as log from "std/log/mod.ts";
import { crypto } from "std/crypto/mod.ts";
import { encodeHex } from "jsr:@std/encoding/hex";
import { SkillModule } from "/src/platform/skillModules/types/SkillModule.ts";
import { assert } from "std/_util/asserts.ts";

const readmeDirectoryPath = Deno.cwd();
const readmeFilePath = resolve(readmeDirectoryPath, "SKILLS.md");
const skillsDirectoryPath = resolve(Deno.cwd(), "./src/skills");

export const readFileHash = async () => {
  const file = await Deno.open(readmeFilePath, { read: true });
  const readableStream = file.readable;
  const fileHashBuffer = await crypto.subtle.digest("SHA-256", readableStream);
  const hash = encodeHex(fileHashBuffer);
  return hash;
};

function assertFulfilled<T>(
  item: PromiseSettledResult<T>,
): item is PromiseFulfilledResult<T> {
  return item.status === "fulfilled";
}

export const generateReadmeSkillsFile = async (force = false) => {
  const skills = [];

  for await (const dirEntry of Deno.readDir(skillsDirectoryPath)) {
    if (dirEntry.isDirectory) {
      skills.push(dirEntry.name);
    }
  }

  const skillData = await Promise.allSettled<SkillModule>(
    skills.map(async (skill) => {
      const { default: skillModule } = await import(
        `../src/skills/${skill}/mod.ts`
      );
      return skillModule as SkillModule;
    }),
  );

  const content = skillData.filter(assertFulfilled).map(({ value }) => {
    const header = `## Skill: "${value.name}"

${value.description}
`;

    const commands = `
### Commands

${
      value.commands.map((command) => {
        if (command.aliases.length === 0) {
          return ` - [x] \`/${command.command}\`: ${command.description}`;
        }

        return ` - [x] \`/${command.command}\` _[aliases: ${
          command.aliases.join(", ")
        }]_: ${command.description}`;
      }).join(`\n`)
    }
`;

    const listeners = `
### Listeners

${
      value.listeners.map((listener) =>
        ` - [x] \`${listener.event}\`: ${listener.description}`
      ).join(`\n`)
    }
`;

    return header.concat(commands).concat(
      value.listeners.length > 0 ? listeners : "",
    );
  }).join("\n");

  const encoder = new TextEncoder();
  const newFileContent = encoder.encode(content);
  const newContentHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    newFileContent,
  );
  const newFileHash = encodeHex(newContentHashBuffer);
  const currentFileHash = await readFileHash();

  if (force || currentFileHash !== newFileHash) {
    log.getLogger().warning(
      `Generated SKILLS.md file hash are different. Regenerating file."`,
    );
    await Deno.writeFile(readmeFilePath, newFileContent);
    log.getLogger().info(`Wrote skills readme file at "${readmeFilePath}"`);
  } else {
    log.getLogger().info(
      `No skill changes detected. Skipping writing skills readme file.`,
    );
  }
};

if (import.meta.main) {
  await generateReadmeSkillsFile(true);
}
