import type { CommandMiddleware } from "grammy/mod.ts";
import * as queryString from "querystring";
import type { BotContext } from "/src/context/mod.ts";
import { SalaryPaycheck } from "dutch-tax-income-calculator";
import outdent from "outdent";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const cmdGetIncomeReport: CommandMiddleware<BotContext> = (
  ctx,
) => {
  const params = queryString.parse(ctx.match);

  if (!params.income) {
    return ctx.reply(
      "Please specify the `income` parameter. Example: income=36000",
    );
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
      choice: "normal",
    },
  );

  const report = outdent`
<pre>
Year Gross Income     : ${formatter.format(paycheck.grossYear)} 
Year Tax Free Income  : ${formatter.format(paycheck.taxFreeYear)}
Year Taxable Income   : ${formatter.format(paycheck.taxableYear)}
Hour Gross Income     : ${formatter.format(paycheck.grossHour)} 
Payroll Tax           : ${formatter.format(paycheck.payrollTax)} 
Social Security Tax   : ${formatter.format(paycheck.socialTax)} 
General Tax Credit    : ${formatter.format(paycheck.taxCredit)} 
Labour Tax Credit     : ${formatter.format(paycheck.labourCredit)} 
Total Income Tax      : ${formatter.format(paycheck.incomeTax)} 
Year Net Income       : ${formatter.format(paycheck.netYear)} 
Month Net Income      : ${formatter.format(paycheck.netMonth)} 
</pre>`;

  return ctx.reply(report, {
    parse_mode: "HTML",
  });
};
