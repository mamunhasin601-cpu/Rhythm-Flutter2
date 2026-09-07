import { describe, expect, it } from "vitest";
import { formatFlowDuration } from "./formatDuration";

describe("formatFlowDuration", () => {
  it("показывает 25 минут как 25 минут, а не 25 часов", () => {
    expect(formatFlowDuration(25 * 60)).toBe("25 мин");
  });

  it("корректно форматирует длительность больше часа", () => {
    expect(formatFlowDuration(90 * 60)).toBe("1 ч 30 мин");
  });
});
