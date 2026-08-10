import type { ExchangeRateResponse } from "/src/skills/currency/httpClients/convertCurrencyValue.ts";

type Dimension = "angle" | "currency" | "length" | "mass" | "time" | "volume";
type Dimensions = Partial<Record<Dimension, number>>;

interface UnitDefinition {
  aliases: readonly string[];
  dimensions: Dimensions;
  scale: number;
  symbol: string;
}

export interface CalculationResult {
  dimensions: Dimensions;
  displayUnit?: Omit<UnitDefinition, "aliases">;
  value: number;
}

type TokenType =
  | "comma"
  | "eof"
  | "identifier"
  | "leftParen"
  | "number"
  | "operator"
  | "rightParen";

interface Token {
  text: string;
  type: TokenType;
  value?: number;
}

const MAX_EXPRESSION_LENGTH = 500;
const MAX_TOKENS = 256;
const DIMENSIONS: readonly Dimension[] = [
  "angle",
  "currency",
  "length",
  "mass",
  "time",
  "volume",
];

const unit = (
  symbol: string,
  dimension: Dimension,
  scale: number,
  aliases: readonly string[] = [],
): UnitDefinition => ({
  aliases: [symbol, ...aliases],
  dimensions: { [dimension]: 1 },
  scale,
  symbol,
});

const STATIC_UNITS: readonly UnitDefinition[] = [
  unit("rad", "angle", 1, ["radian", "radians"]),
  unit("deg", "angle", Math.PI / 180, ["degree", "degrees"]),

  unit("nm", "length", 1e-9, ["nanometer", "nanometers"]),
  unit("um", "length", 1e-6, ["µm", "μm", "micrometer", "micrometers"]),
  unit("mm", "length", 1e-3, ["millimeter", "millimeters"]),
  unit("cm", "length", 1e-2, ["centimeter", "centimeters"]),
  unit("m", "length", 1, ["meter", "meters", "metre", "metres"]),
  unit("km", "length", 1e3, [
    "kilometer",
    "kilometers",
    "kilometre",
    "kilometres",
  ]),
  unit("in", "length", 0.0254, ["inch", "inches"]),
  unit("ft", "length", 0.3048, ["foot", "feet"]),
  unit("yd", "length", 0.9144, ["yard", "yards"]),
  unit("mi", "length", 1609.344, ["mile", "miles"]),

  unit("mg", "mass", 1e-6, ["milligram", "milligrams"]),
  unit("g", "mass", 1e-3, ["gram", "grams"]),
  unit("kg", "mass", 1, ["kilogram", "kilograms"]),
  unit("t", "mass", 1e3, ["tonne", "tonnes"]),
  unit("oz", "mass", 0.028349523125, ["ounce", "ounces"]),
  unit("lb", "mass", 0.45359237, ["pound", "pounds", "lbs"]),

  unit("ms", "time", 1e-3, ["millisecond", "milliseconds"]),
  unit("s", "time", 1, ["sec", "second", "seconds"]),
  unit("min", "time", 60, ["minute", "minutes"]),
  unit("h", "time", 3600, ["hr", "hour", "hours"]),
  unit("day", "time", 86400, ["days"]),
  unit("week", "time", 604800, ["weeks"]),

  unit("mL", "volume", 1e-3, [
    "ml",
    "milliliter",
    "milliliters",
    "millilitre",
    "millilitres",
  ]),
  unit("cL", "volume", 1e-2, [
    "cl",
    "centiliter",
    "centiliters",
    "centilitre",
    "centilitres",
  ]),
  unit("dL", "volume", 1e-1, [
    "dl",
    "deciliter",
    "deciliters",
    "decilitre",
    "decilitres",
  ]),
  unit("L", "volume", 1, ["l", "liter", "liters", "litre", "litres"]),
  unit("tsp", "volume", 0.00492892159375, ["teaspoon", "teaspoons"]),
  unit("tbsp", "volume", 0.01478676478125, ["tablespoon", "tablespoons"]),
  unit("cup", "volume", 0.2365882365, ["cups"]),
  unit("pt", "volume", 0.473176473, ["pint", "pints"]),
  unit("qt", "volume", 0.946352946, ["quart", "quarts"]),
  unit("gal", "volume", 3.785411784, ["gallon", "gallons"]),
];

const STATIC_UNIT_LOOKUP = new Map<string, UnitDefinition>();
for (const definition of STATIC_UNITS) {
  for (const alias of definition.aliases) {
    STATIC_UNIT_LOOKUP.set(alias, definition);
    STATIC_UNIT_LOOKUP.set(alias.toLowerCase(), definition);
  }
}

const ISO_CURRENCIES = new Set(Intl.supportedValuesOf("currency"));

export class CurrencyRatesRequiredError extends Error {
  constructor() {
    super("Current exchange rates are required for this calculation.");
    this.name = "CurrencyRatesRequiredError";
  }
}

const scalar = (value: number): CalculationResult => ({
  dimensions: {},
  value,
});

const isScalar = ({ dimensions }: CalculationResult) =>
  DIMENSIONS.every((dimension) => !dimensions[dimension]);

const normalizeDimensions = (dimensions: Dimensions): Dimensions => {
  const normalized: Dimensions = {};

  for (const dimension of DIMENSIONS) {
    const exponent = dimensions[dimension] ?? 0;
    if (Math.abs(exponent) > Number.EPSILON) {
      normalized[dimension] = exponent;
    }
  }

  return normalized;
};

const dimensionsMatch = (left: Dimensions, right: Dimensions) =>
  DIMENSIONS.every((dimension) =>
    (left[dimension] ?? 0) === (right[dimension] ?? 0)
  );

const combineDimensions = (
  left: Dimensions,
  right: Dimensions,
  direction: 1 | -1,
) => {
  const dimensions: Dimensions = {};

  for (const dimension of DIMENSIONS) {
    dimensions[dimension] = (left[dimension] ?? 0) +
      direction * (right[dimension] ?? 0);
  }

  return normalizeDimensions(dimensions);
};

const ensureFinite = (value: number) => {
  if (!Number.isFinite(value)) {
    throw new RangeError("The calculation did not produce a finite number.");
  }

  return value;
};

const ensureScalar = (value: CalculationResult, operation: string) => {
  if (!isScalar(value)) {
    throw new TypeError(`${operation} requires a unitless value.`);
  }

  return value.value;
};

const add = (
  left: CalculationResult,
  right: CalculationResult,
  direction: 1 | -1,
): CalculationResult => {
  if (!dimensionsMatch(left.dimensions, right.dimensions)) {
    throw new TypeError("Cannot add or subtract values with different units.");
  }

  return {
    dimensions: left.dimensions,
    displayUnit: left.displayUnit ?? right.displayUnit,
    value: ensureFinite(left.value + direction * right.value),
  };
};

const multiply = (
  left: CalculationResult,
  right: CalculationResult,
): CalculationResult => ({
  dimensions: combineDimensions(left.dimensions, right.dimensions, 1),
  displayUnit: isScalar(left)
    ? right.displayUnit
    : isScalar(right)
    ? left.displayUnit
    : undefined,
  value: ensureFinite(left.value * right.value),
});

const divide = (
  left: CalculationResult,
  right: CalculationResult,
): CalculationResult => {
  if (right.value === 0) {
    throw new RangeError("Division by zero is not allowed.");
  }

  return {
    dimensions: combineDimensions(left.dimensions, right.dimensions, -1),
    displayUnit: isScalar(right) ? left.displayUnit : undefined,
    value: ensureFinite(left.value / right.value),
  };
};

const power = (
  base: CalculationResult,
  exponent: CalculationResult,
): CalculationResult => {
  const rawExponent = ensureScalar(exponent, "Exponentiation");

  if (!isScalar(base) && !Number.isInteger(rawExponent)) {
    throw new TypeError("Values with units require an integer exponent.");
  }

  const dimensions: Dimensions = {};
  for (const dimension of DIMENSIONS) {
    dimensions[dimension] = (base.dimensions[dimension] ?? 0) * rawExponent;
  }

  return {
    dimensions: normalizeDimensions(dimensions),
    displayUnit: rawExponent === 1 ? base.displayUnit : undefined,
    value: ensureFinite(base.value ** rawExponent),
  };
};

const tokenize = (expression: string): Token[] => {
  if (!expression.trim()) {
    throw new SyntaxError("The expression is empty.");
  }

  if (expression.length > MAX_EXPRESSION_LENGTH) {
    throw new SyntaxError("The expression is too long.");
  }

  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const remaining = expression.slice(index);
    const character = expression[index];

    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }

    const numberMatch = remaining.match(
      /^(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?/u,
    );
    if (numberMatch) {
      const value = Number(numberMatch[0]);
      tokens.push({ text: numberMatch[0], type: "number", value });
      index += numberMatch[0].length;
      continue;
    }

    const identifierMatch = remaining.match(/^[A-Za-z_µμ][A-Za-z0-9_µμ]*/u);
    if (identifierMatch) {
      tokens.push({ text: identifierMatch[0], type: "identifier" });
      index += identifierMatch[0].length;
      continue;
    }

    if (character === "(" || character === ")" || character === ",") {
      tokens.push({
        text: character,
        type: character === "("
          ? "leftParen"
          : character === ")"
          ? "rightParen"
          : "comma",
      });
      index += 1;
      continue;
    }

    const normalizedOperator = character === "×"
      ? "*"
      : character === "÷"
      ? "/"
      : character === "−"
      ? "-"
      : character;

    if ("+-*/%^!".includes(normalizedOperator)) {
      const isDoubleAsterisk = normalizedOperator === "*" &&
        expression[index + 1] === "*";
      tokens.push({
        text: isDoubleAsterisk ? "^" : normalizedOperator,
        type: "operator",
      });
      index += isDoubleAsterisk ? 2 : 1;
      continue;
    }

    throw new SyntaxError(`Unexpected character "${character}".`);
  }

  if (tokens.length > MAX_TOKENS) {
    throw new SyntaxError("The expression contains too many elements.");
  }

  tokens.push({ text: "", type: "eof" });
  return tokens;
};

class Parser {
  #index = 0;

  constructor(
    private readonly tokens: readonly Token[],
    private readonly exchangeRates?: ExchangeRateResponse,
  ) {}

  parse(): CalculationResult {
    const result = this.parseAdditive();

    if (this.current.type === "identifier" && this.current.text === "to") {
      this.consume();
      return this.convertTo(result, this.parseTargetUnit());
    }

    this.expect("eof");
    return result;
  }

  private get current() {
    return this.tokens[this.#index];
  }

  private consume() {
    const token = this.current;
    this.#index += 1;
    return token;
  }

  private expect(type: TokenType, text?: string) {
    const token = this.current;
    if (token.type !== type || (text !== undefined && token.text !== text)) {
      throw new SyntaxError(
        `Expected ${text ?? type}, received "${
          token.text || "end of expression"
        }".`,
      );
    }

    return this.consume();
  }

  private matchesOperator(...operators: string[]) {
    return this.current.type === "operator" &&
      operators.includes(this.current.text);
  }

  private matchesType(type: TokenType) {
    return this.current.type === type;
  }

  private parseAdditive(): CalculationResult {
    let result = this.parseMultiplicative();

    while (this.matchesOperator("+", "-")) {
      const operator = this.consume().text;
      result = add(
        result,
        this.parseMultiplicative(),
        operator === "+" ? 1 : -1,
      );
    }

    return result;
  }

  private parseMultiplicative(): CalculationResult {
    let result = this.parseUnary();

    while (
      this.matchesOperator("*", "/", "%") || this.startsImplicitFactor()
    ) {
      const operator = this.matchesOperator("*", "/", "%")
        ? this.consume().text
        : "*";

      if (
        operator === "%" &&
        (this.matchesType("eof") || this.matchesType("rightParen") ||
          this.matchesType("comma") || this.matchesOperator("+", "-", "*", "/"))
      ) {
        result = divide(result, scalar(100));
        continue;
      }

      const right = this.parseUnary();

      if (operator === "*") {
        result = multiply(result, right);
      } else if (operator === "/") {
        result = divide(result, right);
      } else {
        const leftValue = ensureScalar(result, "Remainder");
        const rightValue = ensureScalar(right, "Remainder");
        if (rightValue === 0) {
          throw new RangeError("Division by zero is not allowed.");
        }
        result = scalar(ensureFinite(leftValue % rightValue));
      }
    }

    return result;
  }

  private startsImplicitFactor() {
    if (this.current.type === "identifier" && this.current.text === "to") {
      return false;
    }

    return this.current.type === "number" ||
      this.current.type === "identifier" ||
      this.current.type === "leftParen";
  }

  private parseUnary(): CalculationResult {
    if (this.matchesOperator("+", "-")) {
      const operator = this.consume().text;
      const value = this.parseUnary();
      return operator === "+"
        ? value
        : { ...value, value: ensureFinite(-value.value) };
    }

    return this.parsePower();
  }

  private parsePower(): CalculationResult {
    let result = this.parsePostfix();

    if (this.matchesOperator("^")) {
      this.consume();
      result = power(result, this.parseUnary());
    }

    return result;
  }

  private parsePostfix(): CalculationResult {
    let result = this.parsePrimary();

    while (this.matchesOperator("!")) {
      this.consume();
      const value = ensureScalar(result, "Factorial");
      if (!Number.isInteger(value) || value < 0 || value > 170) {
        throw new RangeError(
          "Factorial requires an integer between zero and 170.",
        );
      }

      let factorial = 1;
      for (let factor = 2; factor <= value; factor += 1) {
        factorial *= factor;
      }
      result = scalar(factorial);
    }

    return result;
  }

  private parsePrimary(): CalculationResult {
    if (this.current.type === "number") {
      return scalar(this.consume().value!);
    }

    if (this.matchesType("leftParen")) {
      this.consume();
      const result = this.parseAdditive();
      this.expect("rightParen");
      return result;
    }

    if (this.current.type !== "identifier") {
      throw new SyntaxError(
        `Expected a number, function, or unit; received "${
          this.current.text || "end of expression"
        }".`,
      );
    }

    const identifier = this.consume().text;
    const normalizedIdentifier = identifier.toLowerCase();

    if (this.matchesType("leftParen")) {
      return this.parseFunction(normalizedIdentifier);
    }

    if (normalizedIdentifier === "pi") {
      return scalar(Math.PI);
    }
    if (normalizedIdentifier === "e") {
      return scalar(Math.E);
    }
    if (normalizedIdentifier === "tau") {
      return scalar(2 * Math.PI);
    }

    const definition = this.resolveUnit(identifier);
    return {
      dimensions: definition.dimensions,
      displayUnit: definition,
      value: definition.scale,
    };
  }

  private parseFunction(name: string): CalculationResult {
    this.expect("leftParen");
    const args: CalculationResult[] = [];

    if (this.current.type !== "rightParen") {
      do {
        args.push(this.parseAdditive());
        if (this.current.type !== "comma") {
          break;
        }
        this.consume();
      } while (true);
    }

    this.expect("rightParen");
    return evaluateFunction(name, args);
  }

  private resolveUnit(identifier: string): UnitDefinition {
    const staticUnit = STATIC_UNIT_LOOKUP.get(identifier) ??
      STATIC_UNIT_LOOKUP.get(identifier.toLowerCase());
    if (staticUnit) {
      return staticUnit;
    }

    const currency = identifier.toUpperCase();
    if (ISO_CURRENCIES.has(currency)) {
      if (!this.exchangeRates) {
        throw new CurrencyRatesRequiredError();
      }

      const rate = this.exchangeRates.conversion_rates[currency];
      if (!Number.isFinite(rate) || rate <= 0) {
        throw new TypeError(`No exchange rate is available for ${currency}.`);
      }

      return {
        aliases: [currency, currency.toLowerCase()],
        dimensions: { currency: 1 },
        scale: 1 / rate,
        symbol: currency,
      };
    }

    throw new SyntaxError(`Unknown identifier "${identifier}".`);
  }

  private parseTargetUnit(): Omit<UnitDefinition, "aliases"> {
    let scale = 1;
    let dimensions: Dimensions = {};
    let symbol = "";
    let direction: 1 | -1 = 1;

    while (true) {
      const token = this.expect("identifier");
      const definition = this.resolveUnit(token.text);
      let exponent = 1;

      if (this.matchesOperator("^")) {
        this.consume();
        let sign = 1;
        if (this.matchesOperator("+", "-")) {
          sign = this.consume().text === "-" ? -1 : 1;
        }
        const exponentToken = this.expect("number");
        if (!Number.isInteger(exponentToken.value)) {
          throw new TypeError("Unit exponents must be integers.");
        }
        exponent = sign * exponentToken.value!;
      }

      const effectiveExponent = direction * exponent;
      scale *= definition.scale ** effectiveExponent;
      const poweredDimensions: Dimensions = {};
      for (const dimension of DIMENSIONS) {
        poweredDimensions[dimension] = (definition.dimensions[dimension] ?? 0) *
          exponent;
      }
      dimensions = combineDimensions(dimensions, poweredDimensions, direction);

      const operator = symbol ? (direction === 1 ? "*" : "/") : "";
      symbol += `${operator}${definition.symbol}${
        exponent === 1 ? "" : `^${exponent}`
      }`;

      if (!this.matchesOperator("*", "/")) {
        break;
      }
      direction = this.consume().text === "/" ? -1 : 1;
    }

    this.expect("eof");
    return {
      dimensions: normalizeDimensions(dimensions),
      scale: ensureFinite(scale),
      symbol,
    };
  }

  private convertTo(
    value: CalculationResult,
    target: Omit<UnitDefinition, "aliases">,
  ): CalculationResult {
    if (!dimensionsMatch(value.dimensions, target.dimensions)) {
      throw new TypeError(
        "Cannot convert between values with different units.",
      );
    }

    return {
      dimensions: value.dimensions,
      displayUnit: target,
      value: value.value,
    };
  }
}

const requireArgumentCount = (
  name: string,
  args: readonly CalculationResult[],
  minimum: number,
  maximum = minimum,
) => {
  if (args.length < minimum || args.length > maximum) {
    const expected = minimum === maximum
      ? `${minimum}`
      : `${minimum}-${maximum}`;
    throw new TypeError(`${name} expects ${expected} argument(s).`);
  }
};

const evaluateFunction = (
  name: string,
  args: readonly CalculationResult[],
): CalculationResult => {
  if (["abs", "ceil", "floor", "round", "sign", "trunc"].includes(name)) {
    requireArgumentCount(name, args, 1);
    const operation = {
      abs: Math.abs,
      ceil: Math.ceil,
      floor: Math.floor,
      round: Math.round,
      sign: Math.sign,
      trunc: Math.trunc,
    }[name]!;
    return { ...args[0], value: ensureFinite(operation(args[0].value)) };
  }

  if (name === "sqrt" || name === "cbrt") {
    requireArgumentCount(name, args, 1);
    const exponent = name === "sqrt" ? 1 / 2 : 1 / 3;
    if (!isScalar(args[0])) {
      const divisor = name === "sqrt" ? 2 : 3;
      const exponentsAreCompatible = DIMENSIONS.every((dimension) =>
        (args[0].dimensions[dimension] ?? 0) % divisor === 0
      );
      if (!exponentsAreCompatible) {
        throw new TypeError(`${name} cannot be applied to these units.`);
      }
    }

    const dimensions: Dimensions = {};
    for (const dimension of DIMENSIONS) {
      dimensions[dimension] = (args[0].dimensions[dimension] ?? 0) * exponent;
    }
    return {
      dimensions: normalizeDimensions(dimensions),
      value: ensureFinite(
        name === "sqrt" ? Math.sqrt(args[0].value) : Math.cbrt(args[0].value),
      ),
    };
  }

  if (name === "min" || name === "max") {
    requireArgumentCount(name, args, 1, Number.MAX_SAFE_INTEGER);
    if (
      !args.every((value) =>
        dimensionsMatch(value.dimensions, args[0].dimensions)
      )
    ) {
      throw new TypeError(`${name} requires values with matching units.`);
    }
    const selected = args.reduce((current, value) =>
      name === "min"
        ? (value.value < current.value ? value : current)
        : (value.value > current.value ? value : current)
    );
    return {
      ...selected,
      displayUnit: args[0].displayUnit ?? selected.displayUnit,
    };
  }

  if (name === "pow") {
    requireArgumentCount(name, args, 2);
    return power(args[0], args[1]);
  }

  const scalarFunctions: Record<string, (...values: number[]) => number> = {
    acos: Math.acos,
    acosh: Math.acosh,
    asin: Math.asin,
    asinh: Math.asinh,
    atan: Math.atan,
    atan2: Math.atan2,
    atanh: Math.atanh,
    cos: Math.cos,
    cosh: Math.cosh,
    exp: Math.exp,
    hypot: Math.hypot,
    log10: Math.log10,
    log2: Math.log2,
    sin: Math.sin,
    sinh: Math.sinh,
    tan: Math.tan,
    tanh: Math.tanh,
  };

  if (name === "ln" || name === "log") {
    requireArgumentCount(name, args, 1, 2);
    const value = ensureScalar(args[0], name);
    const result = args.length === 2
      ? Math.log(value) / Math.log(ensureScalar(args[1], name))
      : Math.log(value);
    return scalar(ensureFinite(result));
  }

  const operation = scalarFunctions[name];
  if (!operation) {
    throw new SyntaxError(`Unknown function "${name}".`);
  }

  const expectedArguments = name === "atan2" ? 2 : name === "hypot" ? 1 : 1;
  requireArgumentCount(
    name,
    args,
    expectedArguments,
    name === "hypot" ? Number.MAX_SAFE_INTEGER : expectedArguments,
  );

  const values = args.map((value) => {
    if (
      ["cos", "sin", "tan"].includes(name) &&
      dimensionsMatch(value.dimensions, { angle: 1 })
    ) {
      return value.value;
    }
    return ensureScalar(value, name);
  });

  return scalar(ensureFinite(operation(...values)));
};

export const evaluateCalculation = (
  expression: string,
  exchangeRates?: ExchangeRateResponse,
) => new Parser(tokenize(expression), exchangeRates).parse();

const formatScalar = (value: number) => {
  const normalized = Object.is(value, -0) ? 0 : value;
  return Number(normalized.toPrecision(14)).toString();
};

const formatDimensions = (dimensions: Dimensions) => {
  const numerator: string[] = [];
  const denominator: string[] = [];
  const baseSymbols: Record<Dimension, string> = {
    angle: "rad",
    currency: "currency",
    length: "m",
    mass: "kg",
    time: "s",
    volume: "L",
  };

  for (const dimension of DIMENSIONS) {
    const exponent = dimensions[dimension] ?? 0;
    if (!exponent) {
      continue;
    }

    const formatted = `${baseSymbols[dimension]}${
      Math.abs(exponent) === 1 ? "" : `^${Math.abs(exponent)}`
    }`;
    (exponent > 0 ? numerator : denominator).push(formatted);
  }

  const top = numerator.join("*") || "1";
  return denominator.length ? `${top}/${denominator.join("*")}` : top;
};

export const formatCalculationResult = (result: CalculationResult) => {
  if (isScalar(result)) {
    return formatScalar(result.value);
  }

  const unit = result.displayUnit;
  const displayValue = unit ? result.value / unit.scale : result.value;
  const symbol = unit?.symbol ?? formatDimensions(result.dimensions);
  return `${displayValue.toFixed(2)} ${symbol}`;
};
