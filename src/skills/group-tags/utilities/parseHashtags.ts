export const parseHashtags = (text: string) => {
  const words = text.split(" ");
  const hashtags = words
    .filter((word) => word.startsWith("#"))
    .map((word) => word.slice(1));
  return hashtags;
};
