import { getLogger } from "std/log/mod.ts";
import { Bot } from "grammy/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const injectCommand = (bot: Bot<BotContext>) => {
  bot.command(["temperature", "temp"], cmdTemperature);
};

export const cmdTemperature: CommandMiddleware<BotContext> = async (ctx) => {
  const query = ctx.match;

  try {
    const result = await ctx.weatherApi.queryWeather({ query });
    return ctx.reply(`Temperature in "${query}": ${result.main.temp}ºC`);
  } catch (error) {
    getLogger().error(error);
    return ctx.reply(
      `Failed to find weather data regarding your query. Try again.`,
    );
  }
};
