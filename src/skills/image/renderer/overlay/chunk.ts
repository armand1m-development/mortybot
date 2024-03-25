export const splitStringIntoChunks = (
  text: string,
  characterSize: number,
  availableWidth: number,
): string[] => {
  const words = text.split(" ");
  const chunks: string[] = [];
  let currentChunk = "";
  let currentWidth = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordWidth = word.length * characterSize;

    if (currentWidth + wordWidth <= availableWidth) {
      currentChunk += word + " ";
      currentWidth += wordWidth;
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = word + " ";
      currentWidth = wordWidth;
    }
  }

  if (currentChunk.trim() !== "") {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};
