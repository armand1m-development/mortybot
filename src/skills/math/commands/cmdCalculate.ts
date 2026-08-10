import type { CommandMiddleware } from "grammy";
import type { BotContext } from "/src/context/mod.ts";
import {
  CurrencyRatesRequiredError,
  evaluateCalculation,
  formatCalculationResult,
} from "../utilities/calculator.ts";
import { getExchangeRates } from "../utilities/exchangeRates.ts";

export const cmdCalculate: CommandMiddleware<BotContext> = async (ctx) => {
  let result;

  try {
    result = evaluateCalculation(ctx.match);
  } catch (error) {
    if (!(error instanceof CurrencyRatesRequiredError)) {
      return ctx.reply(ctx.t("math.invalidExpression"));
    }

    let exchangeRates;
    try {
      exchangeRates = await getExchangeRates(
        ctx.configuration.exchangeApiToken,
      );
    } catch {
      return ctx.reply(ctx.t("math.exchangeRatesUnavailable"));
    }

    try {
      result = evaluateCalculation(ctx.match, exchangeRates);
    } catch {
      return ctx.reply(ctx.t("math.invalidExpression"));
    }
  }

  return ctx.reply(formatCalculationResult(result));
};
