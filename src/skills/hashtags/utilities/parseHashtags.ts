export const parseHashtags = (text: string) => {
  return text.split(" ").filter((word) => word.startsWith("#"));
};
