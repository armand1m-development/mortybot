// deno-lint-ignore no-control-regex -- Control characters are exactly what this sanitizer must escape.
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/gu;

export const sanitizeLogText = (value: string, maximumLength = 2_000) =>
  value
    .replace(CONTROL_CHARACTER_PATTERN, (character) =>
      `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`)
    .slice(0, maximumLength);

export const getSafeErrorSummary = (error: unknown) => {
  if (!(error instanceof Error)) {
    return "Unknown error";
  }

  return sanitizeLogText(`${error.name}: ${error.message}`, 500);
};
