import type { Task } from "../../lib/types";

export type NowTaskKind = "current" | "overdue" | "next";

export interface NowTaskSelection {
  kind: NowTaskKind;
  task: Task;
}

/**
 * Выбирает одну задачу для карточки «Сейчас».
 * Незакрытая просроченная задача важнее следующей будущей: она не должна
 * исчезать только потому, что её временной слот уже закончился.
 */
export function selectNowTask(tasks: Task[], date: string, nowMin: number): NowTaskSelection | null {
  const todo = tasks.filter((task) => task.date === date && task.status === "todo" && !task.recurrenceRule);

  const current = todo
    .filter((task) => task.startMin <= nowMin && task.endMin > nowMin)
    .sort((a, b) => a.endMin - b.endMin)[0];
  if (current) return { kind: "current", task: current };

  const overdue = todo.filter((task) => task.endMin <= nowMin).sort((a, b) => b.endMin - a.endMin)[0];
  if (overdue) return { kind: "overdue", task: overdue };

  const next = todo.filter((task) => task.startMin > nowMin).sort((a, b) => a.startMin - b.startMin)[0];
  return next ? { kind: "next", task: next } : null;
}
