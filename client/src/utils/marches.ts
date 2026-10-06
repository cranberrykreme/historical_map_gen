import { MarchTiming } from "../types";
import { HistoryTime, MINUTE } from "./historyTime";
import { Playback } from "./pathPlayback";

// When a march happens in history: from `start` to `end`, of which the first `turn` days are
// spent turning on the spot to face the route (0 when no turn is needed). Defined with the
// other saved types, because paths store it.
export type { MarchTiming };

// The shortest any part of a march can be
export const MIN_SPAN_DAYS = MINUTE;

// How far through its turn and through its travel a march is, each 0 to 1
export interface MarchPhase {
  turn: number;
  travel: number;
}

export type MarchDragMode = "move" | "start" | "end" | "split";

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function marchPhase(timing: MarchTiming, t: HistoryTime): MarchPhase {
  const turnEnd = timing.start + timing.turn;
  const turn =
    timing.turn > 0
      ? clamp01((t - timing.start) / timing.turn)
      : t >= timing.start
        ? 1
        : 0;
  const travelSpan = timing.end - turnEnd;
  const travel =
    travelSpan > 0
      ? clamp01((t - turnEnd) / travelSpan)
      : t >= timing.end
        ? 1
        : 0;
  return { turn, travel };
}

// How long the turn takes by default: the same share of the march as turning takes in the
// playback at the standard turning and marching speeds
export function defaultTurn(
  playback: Playback,
  start: HistoryTime,
  end: HistoryTime
): number {
  if (playback.length <= 0) return 0;
  return ((end - start) * playback.pivotLength) / playback.length;
}

// Keeps a timing sensible: the march ends after it starts, and the turn leaves some travel
export function clampMarch(timing: MarchTiming): MarchTiming {
  const end = Math.max(timing.end, timing.start + MIN_SPAN_DAYS);
  const longestTurn = end - timing.start - MIN_SPAN_DAYS;
  const turn = Math.min(Math.max(timing.turn, 0), Math.max(longestTurn, 0));
  // Dates far from 1970 leave rounding crumbs; a turn under a millisecond is no turn
  return { start: timing.start, end, turn: turn < 1e-8 ? 0 : turn };
}

// Rounds a moment to the nearest whole step (an hour, a day...). A step of 0 leaves it as it is.
export function snapTime(t: number, step: number): number {
  return step > 0 ? Math.round(t / step) * step : t;
}

// What dragging part of a march's bar does. `delta` is how far the pointer moved, in days.
// "move" shifts the whole march, "start" and "end" change those edges and keep the turn's
// length, and "split" moves the line between turning and travelling, so a longer turn means a
// slower one. The edge being dragged snaps to `snap` days.
export function dragMarch(
  original: MarchTiming,
  delta: number,
  mode: MarchDragMode,
  snap: number
): MarchTiming {
  const { start, end, turn } = original;

  if (mode === "move") {
    const newStart = snapTime(start + delta, snap);
    return { start: newStart, end: newStart + (end - start), turn };
  }
  if (mode === "start") {
    const latest = end - turn - MIN_SPAN_DAYS;
    return {
      start: Math.min(snapTime(start + delta, snap), latest),
      end,
      turn,
    };
  }
  if (mode === "end") {
    const earliest = start + turn + MIN_SPAN_DAYS;
    return {
      start,
      end: Math.max(snapTime(end + delta, snap), earliest),
      turn,
    };
  }

  const longestTurn = Math.max(end - start - MIN_SPAN_DAYS, 0);
  const turnEnd = snapTime(start + turn + delta, snap);
  return {
    start,
    end,
    turn: Math.min(Math.max(turnEnd - start, 0), longestTurn),
  };
}
