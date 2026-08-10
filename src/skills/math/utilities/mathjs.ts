import { all, create, type UnitDefinition } from "mathjs";

const math = create(all, {});
const limitedEvaluate = math.evaluate;
const limitedParse = math.parse;
const createUnit = math.createUnit;
const format = math.format;

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

export { createUnit, format, limitedEvaluate, limitedParse, math };
export type { UnitDefinition };
