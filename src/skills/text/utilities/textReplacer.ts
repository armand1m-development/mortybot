import { getRandomValue } from "/src/utilities/array/random.ts";

export const textReplacer = (
  table: Record<string, string | undefined>,
  text: string,
) => {
  return text.split("").map((char) => table[char] ?? char).join("");
};

export const multipleTextReplacer = (
  table: Record<string, string[] | undefined>,
  text: string,
) => {
  return text
    .split("")
    .map((char) => {
      const charTable = table[char];
      return Array.isArray(charTable) ? getRandomValue(charTable) : char;
    })
    .join("");
};
