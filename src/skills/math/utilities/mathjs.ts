// @deno-types="https://raw.githubusercontent.com/pammacdotnet/FFRepo/master/mathjs.d.ts"
import { all, create } from "https://dev.jspm.io/mathjs";
import type { UnitDefinition } from "https://raw.githubusercontent.com/pammacdotnet/FFRepo/master/mathjs.d.ts";

const math = create(all, {});
const limitedEvaluate = math.evaluate as math.MathJsStatic["evaluate"];
const limitedParse = math.parse as math.MathJsStatic["parse"];
const createUnit = math.createUnit as math.MathJsStatic["createUnit"];
const format = math.format as math.MathJsStatic["format"];

math.import && math.import({
  "import": function () {
    throw new Error("Function import is disabled");
  },
  "createUnit": function () {
    throw new Error("Function createUnit is disabled");
  },
  "evaluate": function () {
    throw new Error("Function evaluate is disabled");
  },
  "parse": function () {
    throw new Error("Function parse is disabled");
  },
  "simplify": function () {
    throw new Error("Function simplify is disabled");
  },
  "derivative": function () {
    throw new Error("Function derivative is disabled");
  },
}, {
  override: true,
});

export {
  createUnit,
  format,
  limitedEvaluate,
  limitedParse,
  math,
  UnitDefinition,
};
