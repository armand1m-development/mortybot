import { getLogger } from "std/log/mod.ts";
import { CommandMiddleware } from "grammy/composer.ts";
import { parseConvertMessage } from "../utilities/parseConvertMessage.ts";
import { BotContext } from "/src/context/mod.ts";

export const cmdConvert: CommandMiddleware<BotContext> = async (ctx) => {
  const { parseError, amount, fromCurrency, toCurrency } = parseConvertMessage(
    ctx.match,
  );

  if (parseError !== undefined) {
    return ctx.reply(
      "Failed to extract parameters from your text. Please send a message like `/convert 150 EUR to BRL`.",
    );
  }

  try {
    const convertedValue = await ctx.currencyApi.convertCurrencyValue({
      amount,
      fromCurrency,
      toCurrency,
    });

    return ctx.reply(`${amount} ${fromCurrency}: ${convertedValue}`);
  } catch (error) {
    getLogger().error(error);
    return ctx.reply("Failed to convert the value.");
  }
};
