import { getLogger } from "std/log/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdTemperature: CommandMiddleware<BotContext> = async (ctx) => {
  const query = ctx.match;

  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    const { main: { temp } } = await ctx.weatherApi.queryWeather({ query });
    return ctx.reply(`Temperature in "${query}": ${temp}ºC`);
  } catch (error) {
    getLogger().error(error);
    return ctx.reply(
      `Failed to find weather data regarding your query. Try again.`,
    );
  }
};
