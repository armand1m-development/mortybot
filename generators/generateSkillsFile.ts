import { resolve } from "std/path/posix.ts";
import * as log from "std/log/mod.ts";
import { crypto } from "std/crypto/mod.ts";
import { encodeHex } from "jsr:@std/encoding/hex";

const skillsDirectoryPath = resolve(Deno.cwd(), "./src/skills");
const skillsFilePath = resolve(skillsDirectoryPath, "skills.ts");

export const readFileHash = async () => {
  const file = await Deno.open(skillsFilePath, { read: true });
  const readableStream = file.readable;
  const fileHashBuffer = await crypto.subtle.digest("SHA-256", readableStream);
  const hash = encodeHex(fileHashBuffer);
  return hash;
};

export const generateSkillsFile = async (force = false) => {
  const skills = [];

  for await (const dirEntry of Deno.readDir(skillsDirectoryPath)) {
    if (dirEntry.isDirectory) {
      skills.push(dirEntry.name);
    }
  }

  const code = `// THIS FILE IS AUTO-GENERATED DURING STARTUP
// RUN \`deno task generate:skills\` TO FORCE UPDATE
export const skills = [
  ${skills.map((skill) => `"${skill}"`).join(",\n  ")}
] as const;

export type Skill = typeof skills[number];
`;

  const encoder = new TextEncoder();
  const data = encoder.encode(code);

  const fileHash = await readFileHash();
  const newContentHashBuffer = await crypto.subtle.digest("SHA-256", data);
  const newFileHash = encodeHex(newContentHashBuffer);

  if (force || fileHash !== newFileHash) {
    await Deno.writeFile(skillsFilePath, data);
    log.getLogger().info(`wrote skills file at "${skillsFilePath}"`);
  } else {
    log.getLogger().info(
      `no skill changes detected. skipping writing skills file.`,
    );
  }
};

if (import.meta.main) {
  await generateSkillsFile(true);
}
