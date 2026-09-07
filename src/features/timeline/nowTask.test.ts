import { describe, expect, it } from "vitest";
import type { Task } from "../../lib/types";
import { selectNowTask } from "./nowTask";

const DATE = "2026-09-05";

function task(id: string, startMin: number, endMin: number, status: Task["status"] = "todo"): Task {
  return {
    id,
    userId: "u1",
    title: id,
    description: "",
    date: DATE,
    startMin,
    endMin,
    color: "violet",
    icon: "target",
    tags: [],
    energy: "medium",
    status,
    source: "local",
    syncStatus: "local",
    createdAt: "2026-09-05T08:00:00.000Z",
    updatedAt: "2026-09-05T08:00:00.000Z",
  };
}

describe("selectNowTask", () => {
  it("возвращает последнюю незакрытую просроченную задачу до будущей", () => {
    const selected = selectNowTask(
      [task("older", 480, 540), task("overdue", 600, 660), task("next", 780, 840)],
      DATE,
      720
    );

    expect(selected).toEqual({ kind: "overdue", task: expect.objectContaining({ id: "overdue" }) });
  });

  it("текущая задача важнее просроченной", () => {
    const selected = selectNowTask([task("overdue", 480, 540), task("current", 690, 750)], DATE, 720);

    expect(selected).toEqual({ kind: "current", task: expect.objectContaining({ id: "current" }) });
  });

  it("не считает выполненную задачу просроченной", () => {
    expect(selectNowTask([task("done", 600, 660, "done")], DATE, 720)).toBeNull();
  });
});
