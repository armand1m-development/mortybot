import { parse as parseIcu, TYPE } from "@formatjs/icu-messageformat-parser";
import { parse as parseYaml } from "@std/yaml";
import { resolve } from "@std/path/posix";

const catalogPath = resolve(Deno.cwd(), "src/i18n/translations.yaml");
const generatedPath = resolve(
  Deno.cwd(),
  "src/i18n/translations.generated.ts",
);

type IcuArgumentType = "date" | "number" | "primitive" | "select";
type IcuElement = {
  type: TYPE;
  value?: string;
  children?: IcuElement[];
  options?: Record<string, { value: IcuElement[] }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const flattenCatalog = (
  value: Record<string, unknown>,
  prefix = "",
): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof child === "string") {
      result[path] = child;
      continue;
    }

    if (!isRecord(child)) {
      throw new TypeError(`Translation "${path}" must be a string or object.`);
    }

    Object.assign(result, flattenCatalog(child, path));
  }

  return result;
};

const addArgumentType = (
  argumentsByName: Map<string, Set<IcuArgumentType>>,
  name: string | undefined,
  type: IcuArgumentType,
) => {
  if (!name) return;
  const types = argumentsByName.get(name) ?? new Set<IcuArgumentType>();
  types.add(type);
  argumentsByName.set(name, types);
};

const collectArguments = (
  elements: IcuElement[],
  argumentsByName = new Map<string, Set<IcuArgumentType>>(),
) => {
  for (const element of elements) {
    switch (element.type) {
      case TYPE.argument:
        addArgumentType(argumentsByName, element.value, "primitive");
        break;
      case TYPE.number:
      case TYPE.plural:
        addArgumentType(argumentsByName, element.value, "number");
        break;
      case TYPE.date:
      case TYPE.time:
        addArgumentType(argumentsByName, element.value, "date");
        break;
      case TYPE.select:
        addArgumentType(argumentsByName, element.value, "select");
        break;
    }

    if (element.children) {
      collectArguments(element.children, argumentsByName);
    }

    for (const option of Object.values(element.options ?? {})) {
      collectArguments(option.value, argumentsByName);
    }
  }

  return argumentsByName;
};

const argumentTypeToTypescript = (types: Set<IcuArgumentType>) => {
  const output = new Set<string>();

  for (const type of types) {
    if (type === "number") output.add("number");
    if (type === "date") output.add("Date | number");
    if (type === "select") output.add("string");
    if (type === "primitive") output.add("string | number | Date");
  }

  return [...output].sort().join(" | ");
};

const getSignature = (message: string) => {
  const ast = parseIcu(message) as IcuElement[];
  const argumentsByName = collectArguments(ast);

  return [...argumentsByName.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, types]) => [name, argumentTypeToTypescript(types)] as const);
};

const serializeSignature = (signature: readonly (readonly string[])[]) =>
  JSON.stringify(signature);

const createGeneratedSource = (yaml: string) => {
  const document = parseYaml(yaml);
  if (!isRecord(document)) {
    throw new TypeError("The translation catalog must be an object.");
  }

  const languages = Object.keys(document).sort();
  if (!languages.includes("en") || !languages.includes("pt")) {
    throw new TypeError("The translation catalog must include en and pt.");
  }

  const catalogs = Object.fromEntries(languages.map((language) => {
    const catalog = document[language];
    if (!isRecord(catalog)) {
      throw new TypeError(`The ${language} catalog must be an object.`);
    }
    return [language, flattenCatalog(catalog)];
  }));

  const reference = catalogs.en;
  const keys = Object.keys(reference).sort();

  for (const language of languages) {
    const localizedKeys = Object.keys(catalogs[language]).sort();
    if (JSON.stringify(localizedKeys) !== JSON.stringify(keys)) {
      throw new TypeError(
        `The ${language} catalog does not contain the same keys as en.`,
      );
    }

    for (const key of keys) {
      const referenceSignature = serializeSignature(
        getSignature(reference[key]),
      );
      const localizedSignature = serializeSignature(
        getSignature(catalogs[language][key]),
      );
      if (localizedSignature !== referenceSignature) {
        throw new TypeError(
          `Translation "${key}" has incompatible arguments in ${language}.`,
        );
      }
    }
  }

  const valueEntries = keys.map((key) => {
    const signature = getSignature(reference[key]);
    const values = signature.length === 0
      ? "Record<never, never>"
      : `{ ${
        signature.map(([name, type]) => `${JSON.stringify(name)}: ${type}`)
          .join("; ")
      } }`;
    return `  ${JSON.stringify(key)}: ${values};`;
  }).join("\n");

  return `// THIS FILE IS AUTO-GENERATED FROM translations.yaml
// RUN \`deno task generate:i18n\` TO UPDATE IT
export const supportedLanguages = ${JSON.stringify(languages)} as const;
export type Language = typeof supportedLanguages[number];

export const translationKeys = ${JSON.stringify(keys, null, 2)} as const;
export type TranslationKey = typeof translationKeys[number];

export interface TranslationValues {
${valueEntries}
}

export type Translate = <Key extends TranslationKey>(
  key: Key,
  ...values: keyof TranslationValues[Key] extends never
    ? [values?: undefined]
    : [values: TranslationValues[Key]]
) => string;
`;
};

export const generateTranslationsFile = async (check = false) => {
  const yaml = await Deno.readTextFile(catalogPath);
  const generatedSource = createGeneratedSource(yaml);

  let currentSource: string | undefined;
  try {
    currentSource = await Deno.readTextFile(generatedPath);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }

  if (check && currentSource !== generatedSource) {
    throw new Error(
      "src/i18n/translations.generated.ts is stale. Run `deno task generate:i18n`.",
    );
  }

  if (!check && currentSource !== generatedSource) {
    await Deno.writeTextFile(generatedPath, generatedSource);
  }
};

if (import.meta.main) {
  await generateTranslationsFile(Deno.args.includes("--check"));
}
