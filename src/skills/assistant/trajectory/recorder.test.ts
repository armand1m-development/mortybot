import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  createAssistantTrajectoryRecorder,
  serializeTrajectoryError,
} from "./recorder.ts";
import type { AssistantTrajectoryV1 } from "./types.ts";

const context = {
  chatId: -100123,
  chatType: "supergroup",
  updateId: 77,
  messageId: 88,
  userId: 99,
  username: "morty",
};

Deno.test("trajectory recorder checkpoints ordered events and terminal state", async () => {
  const checkpoints: AssistantTrajectoryV1[] = [];
  let tick = 0;
  const recorder = await createAssistantTrajectoryRecorder(
    { dataPath: "/data", model: "test-model", context },
    {
      createId: () => "trajectory-id",
      now: () => new Date(Date.UTC(2026, 7, 18, 12, 0, tick++)),
      writeCheckpoint: (_filePath, trajectory) => {
        checkpoints.push(trajectory);
        return Promise.resolve();
      },
    },
  );

  await recorder.record({
    type: "model_request",
    iteration: 1,
    messages: [{ role: "user", content: "Inspect this" }],
    tools: [],
  });
  await recorder.record({
    type: "model_response",
    iteration: 1,
    durationMs: 42,
    message: { role: "assistant", content: "Inspected." },
  });
  await recorder.succeed();

  assertStringIncludes(
    recorder.filePath,
    "/data/trajectories/-100123/trajectory-id/trajectory.json",
  );
  assertEquals(checkpoints.length, 4);
  assertEquals(checkpoints[0].status, "in_progress");
  assertEquals(checkpoints[0].events, []);
  assertEquals(
    checkpoints[2].events.map((event) => [event.sequence, event.type]),
    [[1, "model_request"], [2, "model_response"]],
  );
  assertEquals(checkpoints[3].status, "succeeded");
  assertEquals(typeof checkpoints[3].completedAt, "string");
  assertEquals(checkpoints[3].assistant.model, "test-model");
  assertEquals(checkpoints[3].context, context);
});

Deno.test("trajectory recorder preserves a failed turn's last checkpoint", async () => {
  const checkpoints: AssistantTrajectoryV1[] = [];
  const recorder = await createAssistantTrajectoryRecorder(
    { dataPath: "/data", model: "test-model", context },
    {
      createId: () => "failed-trajectory",
      writeCheckpoint: (_filePath, trajectory) => {
        checkpoints.push(trajectory);
        return Promise.resolve();
      },
    },
  );

  await recorder.record({
    type: "delivery_failed",
    error: serializeTrajectoryError(new Error("Telegram unavailable")),
  });
  await recorder.fail("delivery", new Error("Telegram unavailable"));

  const final = checkpoints.at(-1)!;
  assertEquals(final.status, "failed");
  assertEquals(final.failure?.stage, "delivery");
  assertEquals(final.failure?.error.name, "Error");
  assertEquals(final.failure?.error.message, "Telegram unavailable");
  assertEquals(final.events.at(-1)?.type, "delivery_failed");
});

Deno.test("trajectory persistence failures do not escape or retry the turn", async () => {
  let writeAttempts = 0;
  const recorder = await createAssistantTrajectoryRecorder(
    { dataPath: "/data", model: "test-model", context },
    {
      createId: () => "unwritable-trajectory",
      writeCheckpoint: () => {
        writeAttempts += 1;
        return Promise.reject(new Error("disk full"));
      },
    },
  );

  await recorder.record({
    type: "final_response",
    result: { content: "Still answer", sources: [], toolInvocations: [] },
  });
  await recorder.succeed();

  assertEquals(writeAttempts, 1);
});
