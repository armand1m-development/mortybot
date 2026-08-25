import { assertEquals } from "@std/assert";
import type { BotCommand } from "grammy/types";
import {
  fitBotCommandMenu,
  MAX_BOT_COMMAND_MENU_BYTES,
} from "./fitBotCommandMenu.ts";

const command = (name: string, description = "x"): BotCommand => ({
  command: name,
  description,
});

Deno.test("a menu inside the limits passes through untouched", () => {
  const commands = [command("memes"), command("list_memes")];

  assertEquals(fitBotCommandMenu(commands), commands);
});

Deno.test("a menu over the byte budget drops trailing entries to fit", () => {
  // ~70 bytes per entry, so three entries overflow a 200-byte budget.
  const commands = [
    command("canonical", "description that takes up some space"),
    command("alias_one", "description that takes up some space"),
    command("alias_two", "description that takes up some space"),
  ];

  const fitted = fitBotCommandMenu(commands, 200);

  assertEquals(fitted.length < commands.length, true);
  assertEquals(fitted[0].command, "canonical");
  assertEquals(
    JSON.stringify({ commands: fitted }).length <= 200,
    true,
  );
});

Deno.test("more than 100 entries are cut to the documented cap", () => {
  const commands = Array.from(
    { length: 130 },
    (_, index) => command(`command_${index}`),
  );

  assertEquals(fitBotCommandMenu(commands).length, 100);
  assertEquals(MAX_BOT_COMMAND_MENU_BYTES > 0, true);
});
