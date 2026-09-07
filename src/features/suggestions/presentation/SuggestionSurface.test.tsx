import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Suggestion } from "../../../lib/types";

const appMock = vi.hoisted(() => ({
  applyReschedule: vi.fn(() => 2),
  toast: vi.fn(),
  addTask: vi.fn(),
}));

const suggestionActions = vi.hoisted(() => ({
  accept: vi.fn(),
  dismiss: vi.fn(),
  snooze: vi.fn(),
}));

const suggestions = vi.hoisted(
  () =>
    [
      {
        id: "duration-1",
        userId: "u1",
        kind: "duration",
        title: "Оценка времени",
        body: "Проверь длительность",
        context: { estimatedMin: 30 },
        priority: 5,
        state: "shown",
        dedupKey: "duration-1",
        createdAt: 1,
      },
      {
        id: "reschedule-1",
        userId: "u1",
        kind: "reschedule",
        title: "Перенести задачи",
        body: "Нашлись новые окна",
        context: {},
        priority: 4,
        state: "shown",
        dedupKey: "reschedule-1",
        createdAt: 2,
      },
    ] satisfies Suggestion[]
);

vi.mock("../../../state/store", () => ({ useApp: () => appMock }));
vi.mock("./hooks/useSuggestions", () => ({
  useSuggestions: () => ({
    active: suggestions,
    top: suggestions[0],
    ...suggestionActions,
  }),
}));

import SuggestionSurface from "./SuggestionSurface";

describe("SuggestionSurface + SmartTray", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appMock.applyReschedule.mockReturnValue(2);
  });

  it("выполняет действие принятой в SmartTray подсказки", async () => {
    render(<SuggestionSurface onPlan={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /Ещё 1 подсказка/ }));
    const tray = screen.getByRole("dialog");
    const acceptButtons = within(tray).getAllByRole("button", { name: /Принять/ });
    await userEvent.click(acceptButtons[1]);

    expect(suggestionActions.accept).toHaveBeenCalledWith("reschedule-1");
    expect(appMock.applyReschedule).toHaveBeenCalledTimes(1);
    expect(appMock.toast).toHaveBeenCalledWith("success", "Перенесено 2 задач(и)");
  });
});
