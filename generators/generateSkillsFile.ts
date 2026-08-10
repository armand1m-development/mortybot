import { resolve } from "@std/path/posix";
import * as log from "@std/log";
import { crypto } from "@std/crypto";
import { encodeHex } from "@std/encoding/hex";

const skillsDirectoryPath = resolve(Deno.cwd(), "./src/skills");
const skillsFilePath = resolve(skillsDirectoryPath, "skills.ts");

export const readFileHash = async () => {
  const file = await Deno.open(skillsFilePath, { read: true });
  const readableStream = file.readable;
  const fileHashBuffer = await crypto.subtle.digest("SHA-256", readableStream);
  const hash = encodeHex(fileHashBuffer);
  return hash;
};

export const generateSkillsFile = async (force = false, check = false) => {
  const skills = [];

  for await (const dirEntry of Deno.readDir(skillsDirectoryPath)) {
    if (dirEntry.isDirectory) {
      skills.push(dirEntry.name);
    }
  }
  skills.sort();

  const code = `// THIS FILE IS AUTO-GENERATED DURING STARTUP
// RUN \`deno task generate:skills\` TO FORCE UPDATE
export const skills = [
  ${skills.map((skill) => `"${skill}"`).join(",\n  ") + ","}
] as const;

export type Skill = typeof skills[number];
`;

  const encoder = new TextEncoder();
  const newFileContent = encoder.encode(code);
  const newContentHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    newFileContent,
  );
  const newFileHash = encodeHex(newContentHashBuffer);
  const currentFileHash = await readFileHash();

  if (check && currentFileHash !== newFileHash) {
    throw new Error(
      "src/skills/skills.ts is stale. Run `deno task generate:skills`.",
    );
  }

  if (force || currentFileHash !== newFileHash) {
    log.getLogger().warn(
      "Generated skills/skills.ts file hashes differ. Regenerating file.",
    );
    await Deno.writeFile(skillsFilePath, newFileContent);
    log.getLogger().info(`Wrote skills file at "${skillsFilePath}"`);
  } else {
    log.getLogger().info(
      `No skill changes detected. Skipping writing skills file.`,
    );
  }
};

if (import.meta.main) {
  await generateSkillsFile(false, Deno.args.includes("--check"));
}
