import { splitStringIntoChunks } from "./chunk.ts";
import { calculateFontSize } from "./font.ts";

export interface GetBoundedChunksProps {
  text: string;
  fontSize: number;
  boxWidth: number;
}

export const getBoundedChunks = (
  { text, fontSize, boxWidth }: GetBoundedChunksProps,
) => {
  const firstCharSize = fontSize / 2;
  const firstChunks = splitStringIntoChunks(text, firstCharSize, boxWidth);
  const dynamicFontSize = calculateFontSize(firstChunks.length, fontSize);
  const charSize = dynamicFontSize / 2;
  const chunks = splitStringIntoChunks(text, charSize, boxWidth);

  return {
    dynamicFontSize,
    charSize,
    chunks,
  };
};
