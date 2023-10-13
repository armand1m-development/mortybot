export const parsePosition = (text: string) => {
  const [latitude, longitude] = text.split(",");
  return { latitude, longitude };
};
