export const DECREASE_RATIO = 1.5;
export const BASE_FONT_SIZE = 50;

export const calculateFontSize = (
  chunkLength: number,
  baseFontSize = BASE_FONT_SIZE,
): number => {
  const decreaseFactor = chunkLength ^ DECREASE_RATIO;
  return baseFontSize - chunkLength * decreaseFactor;
};
