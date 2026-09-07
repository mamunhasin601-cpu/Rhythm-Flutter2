import { fmtDur } from "../../lib/time";

/** Приводит накопленные секунды Flow к пользовательской длительности. */
export function formatFlowDuration(seconds: number): string {
  const minutes = Math.round(Math.max(0, seconds) / 60);
  return fmtDur(minutes);
}
