import { getLogger } from "std/log/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdEURtoBRL: CommandMiddleware<BotContext> = async (ctx) => {
  try {
    const convertedValue = await ctx.currencyApi.convertCurrencyValue({
      amount: 1,
      fromCurrency: "EUR",
      toCurrency: "BRL",
    });

    return ctx.reply(`1 EUR: ${convertedValue}`);
  } catch (error) {
    getLogger().error(error);
    return ctx.reply("Failed to convert the value.");
  }
};
