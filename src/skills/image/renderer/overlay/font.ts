export const DECREASE_RATIO = 2;
export const calculateFontSize = (
  chunkLength: number,
  chosenFontSize: number,
): number => {
  const decreaseFactor = chunkLength ^ DECREASE_RATIO;
  return chosenFontSize - (chunkLength * decreaseFactor);
};
