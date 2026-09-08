import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { todayKey } from "../lib/time";
import { AppProvider, type Ctx, useApp } from "./store";

const DB_KEY = "rhythm.db.v1";
const SESSION_KEY = "rhythm.session.v1";

function Harness({ appRef }: { appRef: { current: Ctx | null } }) {
  appRef.current = useApp();
  return null;
}

describe("store: первый экземпляр повторяющейся задачи", () => {
  beforeEach(() => {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(SESSION_KEY);
  });

  it("материализует экземпляр на дату родительской задачи", async () => {
    const appRef: { current: Ctx | null } = { current: null };
    render(
      <AppProvider>
        <Harness appRef={appRef} />
      </AppProvider>
    );
    await waitFor(() => expect(appRef.current?.booted).toBe(true));

    await act(async () => {
      expect(await appRef.current!.signUp("Повторы", "recurrence@test.local", "password123")).toBeNull();
    });
    await waitFor(() => expect(appRef.current?.user).toBeTruthy());

    const date = todayKey();
    let parentId = "";
    act(() => {
      const parent = appRef.current!.addTask({
        title: "Ежедневная задача",
        description: "",
        date,
        startMin: 800,
        endMin: 860,
        color: "violet",
        icon: "target",
        tags: [],
        energy: "medium",
        recurrenceRule: "FREQ=DAILY;INTERVAL=1",
      });
      expect(parent).not.toBeNull();
      parentId = parent!.id;
    });

    await waitFor(() =>
      expect(
        appRef.current!.tasks.some(
          (task) => task.parentTaskId === parentId && task.date === date && !task.recurrenceRule
        )
      ).toBe(true)
    );
  });
});
