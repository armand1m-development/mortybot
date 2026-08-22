import { dirname, join } from "@std/path";
import { getLogger } from "@std/log";
import type {
  AssistantTrajectoryEventData,
  AssistantTrajectoryRecorder,
  AssistantTrajectoryV1,
  SerializedTrajectoryError,
} from "./types.ts";

const logger = () => getLogger();

export interface CreateAssistantTrajectoryRecorderParams {
  dataPath: string;
  model: string;
  context: AssistantTrajectoryV1["context"];
}

export interface AssistantTrajectoryRecorderDependencies {
  now?: () => Date;
  createId?: (startedAt: Date, updateId: number) => string;
  writeCheckpoint?: (
    filePath: string,
    trajectory: AssistantTrajectoryV1,
  ) => Promise<void>;
}

export const serializeTrajectoryError = (
  error: unknown,
): SerializedTrajectoryError => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
};

const createTrajectoryId = (startedAt: Date, updateId: number): string => {
  const timestamp = startedAt.toISOString().replaceAll(/[:.]/g, "-");
  return `${timestamp}_${updateId}_${crypto.randomUUID()}`;
};

const writeJsonAtomically = async (
  filePath: string,
  trajectory: AssistantTrajectoryV1,
): Promise<void> => {
  await Deno.mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${crypto.randomUUID()}.tmp`;

  try {
    await Deno.writeTextFile(
      temporaryPath,
      JSON.stringify(trajectory, null, 2),
    );
    await Deno.rename(temporaryPath, filePath);
  } catch (error) {
    await Deno.remove(temporaryPath).catch(() => {});
    throw error;
  }
};

class CheckpointedAssistantTrajectoryRecorder
  implements AssistantTrajectoryRecorder {
  readonly trajectoryId: string;
  readonly filePath: string;
  private readonly trajectory: AssistantTrajectoryV1;
  private readonly now: () => Date;
  private readonly writeCheckpoint: (
    filePath: string,
    trajectory: AssistantTrajectoryV1,
  ) => Promise<void>;
  private queue: Promise<void> = Promise.resolve();
  private enabled = true;

  constructor(
    params: CreateAssistantTrajectoryRecorderParams,
    dependencies: AssistantTrajectoryRecorderDependencies,
  ) {
    this.now = dependencies.now ?? (() => new Date());
    this.writeCheckpoint = dependencies.writeCheckpoint ?? writeJsonAtomically;

    const startedAt = this.now();
    this.trajectoryId = (dependencies.createId ?? createTrajectoryId)(
      startedAt,
      params.context.updateId,
    );
    this.filePath = join(
      params.dataPath,
      "trajectories",
      String(params.context.chatId),
      this.trajectoryId,
      "trajectory.json",
    );
    const timestamp = startedAt.toISOString();
    this.trajectory = {
      schemaVersion: 1,
      trajectoryId: this.trajectoryId,
      startedAt: timestamp,
      updatedAt: timestamp,
      status: "in_progress",
      context: structuredClone(params.context),
      assistant: { model: params.model },
      events: [],
    };
  }

  initialize(): Promise<void> {
    return this.enqueue(() => {});
  }

  record(event: AssistantTrajectoryEventData): Promise<void> {
    return this.enqueue(() => {
      this.trajectory.events.push({
        ...structuredClone(event),
        sequence: this.trajectory.events.length + 1,
        timestamp: this.now().toISOString(),
      });
    });
  }

  succeed(): Promise<void> {
    return this.enqueue(() => {
      const completedAt = this.now().toISOString();
      this.trajectory.status = "succeeded";
      this.trajectory.completedAt = completedAt;
      delete this.trajectory.failure;
    });
  }

  fail(stage: string, error: unknown): Promise<void> {
    return this.enqueue(() => {
      const completedAt = this.now().toISOString();
      this.trajectory.status = "failed";
      this.trajectory.completedAt = completedAt;
      this.trajectory.failure = {
        stage,
        error: serializeTrajectoryError(error),
      };
    });
  }

  private enqueue(mutate: () => void): Promise<void> {
    this.queue = this.queue.then(async () => {
      if (!this.enabled) {
        return;
      }

      mutate();
      this.trajectory.updatedAt = this.now().toISOString();

      try {
        await this.writeCheckpoint(
          this.filePath,
          structuredClone(this.trajectory),
        );
      } catch (error) {
        this.enabled = false;
        logger().error(
          `Assistant trajectory "${this.trajectoryId}" could not be checkpointed.`,
        );
        logger().error(error);
      }
    });

    return this.queue;
  }
}

export const createAssistantTrajectoryRecorder = async (
  params: CreateAssistantTrajectoryRecorderParams,
  dependencies: AssistantTrajectoryRecorderDependencies = {},
): Promise<AssistantTrajectoryRecorder> => {
  const recorder = new CheckpointedAssistantTrajectoryRecorder(
    params,
    dependencies,
  );
  await recorder.initialize();
  return recorder;
};
