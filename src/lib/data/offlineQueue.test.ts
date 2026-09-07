import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushQueuedOperations, offlineQueue } from "./offlineQueue";

const USER_ID = "queue-user";

function enqueue(id: string) {
  offlineQueue.push({
    userId: USER_ID,
    table: "tasks",
    kind: "upsert",
    payload: { id, title: id },
  });
}

describe("flushQueuedOperations", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("не удаляет операцию при логической ошибке и сохраняет причину", async () => {
    enqueue("task-1");

    const result = await flushQueuedOperations(USER_ID, async () => {
      throw new Error("row violates policy");
    });

    expect(result).toEqual({ synced: 0, failed: 1, networkBlocked: false });
    expect(offlineQueue.list(USER_ID)).toEqual([
      expect.objectContaining({
        payload: expect.objectContaining({ id: "task-1" }),
        status: "failed",
        attempts: 1,
        lastError: "row violates policy",
      }),
    ]);
  });

  it("оставляет сетевую ошибку pending для следующего повтора", async () => {
    enqueue("task-1");

    const result = await flushQueuedOperations(USER_ID, async () => {
      throw new Error("Failed to fetch");
    });

    expect(result).toEqual({ synced: 0, failed: 0, networkBlocked: true });
    expect(offlineQueue.list(USER_ID)[0]).toMatchObject({ status: "pending", attempts: 0 });
  });

  it("удаляет только подтверждённую сервером операцию", async () => {
    enqueue("task-1");

    expect(await flushQueuedOperations(USER_ID, async () => undefined)).toEqual({
      synced: 1,
      failed: 0,
      networkBlocked: false,
    });
    expect(offlineQueue.list(USER_ID)).toEqual([]);
  });
});
