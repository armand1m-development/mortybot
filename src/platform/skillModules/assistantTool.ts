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

/**
 * Read-only, argument-less command whose output is a textual listing. The
 * assistant can either post it natively or request it as data to answer
 * questions like "which of these have to do with X?" without dumping the
 * whole listing into the chat.
 */
export const listingAssistantTool = (
  description?: string,
): SkillCommandAssistantTool => ({
  ...noArgumentAssistantTool("read", description),
  inspectable: true,
});

/**
 * Read-only, argument-less command whose output is a live snapshot — road
 * cameras and similar feeds that are stale the moment they are posted. The
 * tool's description tells the model to fetch again on every request about
 * current conditions rather than answer from an earlier fetch's note in the
 * conversation history.
 */
export const liveSnapshotAssistantTool = (
  description?: string,
): SkillCommandAssistantTool => ({
  ...noArgumentAssistantTool("read", description),
  volatile: true,
});

export interface TextAssistantToolOptions {
  effect?: SkillCommandToolEffect;
  description?: string;
  argumentDescription?: string;
  enum?: string[];
  inspectable?: boolean;
}

export const textAssistantTool = (
  argumentName: string,
  options: TextAssistantToolOptions = {},
): SkillCommandAssistantTool => ({
  effect: options.effect ?? "read",
  description: options.description,
  inspectable: options.inspectable,
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
