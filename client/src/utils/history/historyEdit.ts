import { clampDate } from "./dates";
import {
  fromHistoryTime,
  HistoryMoment,
  HistoryTime,
  MINUTES_PER_DAY,
  toHistoryTime,
} from "./historyTime";

// The pieces of a moment the editor shows as separate fields
export type MomentFields = HistoryMoment;

export interface DurationFields {
  days: number;
  hours: number;
  minutes: number;
}

const clampInt = (value: number, min: number, max: number) =>
  Math.min(Math.max(Math.round(value), min), max);

export function momentFields(t: HistoryTime): MomentFields {
  return fromHistoryTime(t);
}

// Turns typed fields back into a moment. Anything out of range is pulled back in: a day that
// doesn't exist in that month becomes its last day, hours run 0 to 23 and minutes 0 to 59.
export function fromMomentFields(fields: MomentFields): HistoryTime {
  return toHistoryTime({
    ...clampDate(fields),
    hour: clampInt(fields.hour, 0, 23),
    minute: clampInt(fields.minute, 0, 59),
  });
}

// A length of history as whole days, hours and minutes
export function durationFields(days: number): DurationFields {
  const total = Math.round(Math.max(days, 0) * MINUTES_PER_DAY);
  return {
    days: Math.floor(total / MINUTES_PER_DAY),
    hours: Math.floor((total % MINUTES_PER_DAY) / 60),
    minutes: total % 60,
  };
}

// Typed days, hours and minutes as a length in days. They simply add up, so "0 days 36 hours"
// is a day and a half. Nothing can be negative.
export function fromDurationFields(fields: DurationFields): number {
  const total =
    Math.max(Math.round(fields.days), 0) * MINUTES_PER_DAY +
    Math.max(Math.round(fields.hours), 0) * 60 +
    Math.max(Math.round(fields.minutes), 0);
  return total / MINUTES_PER_DAY;
}

// Whether a path is drawn on the map. At the story's start (no playhead) every path shows, so
// they can all be edited. Past it, a march's path shows only while the march is under way, and
// a path with no march (no units yet) always shows.
export function pathShownAt(
  march: { start: HistoryTime; end: HistoryTime } | undefined,
  now: HistoryTime | null
): boolean {
  if (now === null || !march) return true;
  return march.start <= now && now <= march.end;
}

// The story can't start after its first march begins, or that march would start before the
// story does. Asking for a later start stops at the first march.
export function allowedStoryStart(
  wanted: HistoryTime,
  firstMarch: HistoryTime | null
): HistoryTime {
  return firstMarch === null ? wanted : Math.min(wanted, firstMarch);
}
