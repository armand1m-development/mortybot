import type { BotCommand } from "grammy/types";

/**
 * Telegram's documented setMyCommands limit is 100 entries, but there is a
 * second, undocumented one on the request's total size: somewhere between
 * 8.2 and 8.4 KB the call starts failing as BOT_COMMANDS_TOO_MUCH — the same
 * error the entry count produces, which makes it read like a counting bug.
 * The budget stays well under that boundary.
 */
export const MAX_BOT_COMMAND_MENU_BYTES = 7_800;
export const MAX_BOT_COMMANDS = 100;

const menuBytes = (commands: BotCommand[]): number =>
  JSON.stringify({ commands }).length;

/**
 * Keeps a command menu inside Telegram's limits.
 *
 * Canonical commands always survive; aliases are dropped from the end until
 * the payload fits, because an alias missing from the menu still works when
 * typed. Assumes the canonical entries precede their aliases, which is how
 * the menu is compiled.
 */
export const fitBotCommandMenu = (
  commands: BotCommand[],
  maxBytes = MAX_BOT_COMMAND_MENU_BYTES,
): BotCommand[] => {
  let fitted = commands.slice(0, MAX_BOT_COMMANDS);
  while (menuBytes(fitted) > maxBytes && fitted.length > 0) {
    fitted = fitted.slice(0, -1);
  }
  return fitted;
};
