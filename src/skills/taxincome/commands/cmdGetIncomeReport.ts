import type { CommandMiddleware } from "grammy";
import * as queryString from "querystring";
import type { BotContext } from "/src/context/mod.ts";
import { SalaryPaycheck } from "dutch-tax-income-calculator";
import { getLanguageLocale } from "/src/i18n/mod.ts";

export const cmdGetIncomeReport: CommandMiddleware<BotContext> = (
  ctx,
) => {
  const params = queryString.parse(ctx.match);

  if (!params.income) {
    return ctx.reply(ctx.t("taxIncome.incomeRequired"));
  }

  const income = Number(params.income);
  const year = params.year != undefined ? Number(params.year) : 2024;
  const checked = params.ruling != undefined ? Boolean(params.ruling) : false;
  const allowance = params.allowance != undefined
    ? Boolean(params.allowance)
    : false;
  const socialSecurity = params.socialSecurity != undefined
    ? Boolean(params.socialSecurity)
    : true;
  const hours = params.hours != undefined ? Number(params.hours) : 40;

  const paycheck = new SalaryPaycheck(
    {
      income,
      allowance,
      socialSecurity,
      older: false,
      hours,
    },
    "Year",
    year,
    {
      checked,
      type: "other",
    },
  );

  const formatter = new Intl.NumberFormat(getLanguageLocale(ctx.language), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const format = (value: number) => formatter.format(value);

  const report = `<pre>${
    ctx.t("taxIncome.report", {
      grossHour: format(paycheck.grossHour),
      grossYear: format(paycheck.grossYear),
      incomeTax: format(paycheck.incomeTax),
      labourCredit: format(paycheck.labourCredit),
      netMonth: format(paycheck.netMonth),
      netYear: format(paycheck.netYear),
      payrollTax: format(paycheck.payrollTax),
      socialTax: format(paycheck.socialTax),
      taxCredit: format(paycheck.taxCredit),
      taxableYear: format(paycheck.taxableYear),
      taxFreeYear: format(paycheck.taxFreeYear),
    })
  }</pre>`;

  return ctx.reply(report, {
    parse_mode: "HTML",
  });
};
