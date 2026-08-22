export const defaultAssistantEmojisEnabled = true;

const EMOJI_PATTERN =
  /(?:[#*0-9]\uFE0F?\u20E3)|(?:\p{Regional_Indicator})|(?:\p{Extended_Pictographic})|(?:\p{Emoji_Modifier})|[\u200D\uFE0E\uFE0F\u{E0020}-\u{E007F}]/gu;

export const parseAssistantEmojisEnabled = (
  value: string,
): boolean | undefined => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "on") return true;
  if (normalized === "off") return false;
  return undefined;
};

export const buildAssistantEmojiDirective = (enabled: boolean): string =>
  enabled
    ? ""
    : "Do not use emojis anywhere in your response, including headings, lists, explanations, or generated files.";

export const removeEmojis = (text: string): string =>
  text.replace(EMOJI_PATTERN, "");
