import type {
  SkillCommandAssistantTool,
  SkillCommandToolEffect,
} from "./types/SkillCommand.ts";

const objectSchema = (
  properties: Record<string, unknown>,
  required: string[] = [],
): Record<string, unknown> => ({
  type: "object",
  properties,
  additionalProperties: false,
  ...(required.length > 0 ? { required } : {}),
});

export const requireStringArgument = (
  args: Record<string, unknown>,
  name: string,
): string => {
  const value = args[name];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`Tool argument "${name}" must be a non-empty string.`);
  }
  return value.trim();
};

export const requireNumberArgument = (
  args: Record<string, unknown>,
  name: string,
): number => {
  const value = args[name];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`Tool argument "${name}" must be a finite number.`);
  }
  return value;
};

export const noArgumentAssistantTool = (
  effect: SkillCommandToolEffect = "read",
  description?: string,
): SkillCommandAssistantTool => ({
  effect,
  description,
  parameters: objectSchema({}),
  toCommandInput: () => "",
});

export interface TextAssistantToolOptions {
  effect?: SkillCommandToolEffect;
  description?: string;
  argumentDescription?: string;
  enum?: string[];
}

export const textAssistantTool = (
  argumentName: string,
  options: TextAssistantToolOptions = {},
): SkillCommandAssistantTool => ({
  effect: options.effect ?? "read",
  description: options.description,
  parameters: objectSchema({
    [argumentName]: {
      type: "string",
      description: options.argumentDescription,
      ...(options.enum ? { enum: options.enum } : {}),
    },
  }, [argumentName]),
  toCommandInput: (args) => requireStringArgument(args, argumentName),
});

export const createAssistantTool = (
  parameters: Record<string, unknown>,
  toCommandInput: (args: Record<string, unknown>) => string,
  options: {
    effect?: SkillCommandToolEffect;
    description?: string;
  } = {},
): SkillCommandAssistantTool => ({
  effect: options.effect ?? "read",
  description: options.description,
  parameters,
  toCommandInput,
});

export const assistantToolObjectSchema = objectSchema;
