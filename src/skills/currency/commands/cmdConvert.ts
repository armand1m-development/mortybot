import { getLogger } from "@std/log";
import type { CommandMiddleware } from "grammy";
import { parseConvertMessage } from "../utilities/parseConvertMessage.ts";
import type { BotContext } from "/src/context/mod.ts";

export const cmdConvert: CommandMiddleware<BotContext> = async (ctx) => {
  const { parseError, amount, fromCurrency, toCurrency } = parseConvertMessage(
    ctx.match,
  );

  if (parseError !== undefined) {
    return ctx.reply(ctx.t("currency.usage"));
  }

  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");

    const convertedValue = await ctx.currencyApi.convertCurrencyValue({
      amount,
      fromCurrency,
      toCurrency,
    });

    return ctx.reply(ctx.t("currency.result", {
      amount,
      currency: fromCurrency,
      value: convertedValue,
    }));
  } catch (error) {
    getLogger().error(error);
    return ctx.reply(ctx.t("currency.error"));
  }
};
