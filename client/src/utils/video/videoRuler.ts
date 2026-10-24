import { formatSeconds } from "./shots";

// The ruler along the top of Video mode, in seconds of video

export interface SecondsTick {
  seconds: number;
  label: string;
}

const STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];

// Ticks for a ruler showing `from` to `to` seconds: the finest round step that gives no more
// than `maxTicks`, so it reads in half seconds zoomed right in and in minutes on a long video
export function secondsTicks(
  from: number,
  to: number,
  maxTicks: number
): SecondsTick[] {
  const span = to - from;
  if (!(span > 0) || maxTicks < 1) return [];
  const step =
    STEPS.find((s) => span / s <= maxTicks) ?? STEPS[STEPS.length - 1];
  const ticks: SecondsTick[] = [];
  for (let i = Math.ceil(from / step - 1e-9); i * step <= to + 1e-9; i++) {
    const seconds = Math.round(i * step * 10) / 10;
    ticks.push({ seconds, label: formatSeconds(seconds) });
  }
  return ticks;
}
