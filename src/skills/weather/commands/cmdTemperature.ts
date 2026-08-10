import { getLogger } from "std/log/mod.ts";
import type { CommandMiddleware } from "grammy/composer.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdTemperature: CommandMiddleware<BotContext> = async (ctx) => {
  const query = ctx.match;

  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    const { main: { temp, feels_like } } = await ctx.weatherApi.queryWeather({ query });
    return ctx.reply(`Temperature in "${query}": ${temp}ºC | feels like ${feels_like}ºC`);
  } catch (error) {
    getLogger().error(error);
    return ctx.reply(
      `Failed to find weather data regarding your query. Try again.`,
    );
  }
};
