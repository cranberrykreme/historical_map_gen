import {
  CalendarDate,
  civilFromDays,
  daysFromCivil,
  MONTH_NAMES,
} from "./dates";

// A moment in history: days since the start of 1 January 1970, with the time of day as the
// fraction (0.5 is midday). One continuous number keeps ordering, spans and interpolation
// simple, and it is precise to well under a second for any date we'd ever draw.
export type HistoryTime = number;

export interface HistoryMoment extends CalendarDate {
  hour: number; // 0 to 23
  minute: number; // 0 to 59
}

// How the date in the corner reads: "October 1066", "14 October 1066", or with the time too
export type HistoryDisplay = "months" | "days" | "times";

export const MINUTES_PER_DAY = 1440;
export const HOUR = 1 / 24;
export const MINUTE = 1 / MINUTES_PER_DAY;

const pad = (n: number) => String(n).padStart(2, "0");
const shortMonth = (month: number) => MONTH_NAMES[month - 1].slice(0, 3);

export function toHistoryTime(
  moment: CalendarDate & { hour?: number; minute?: number }
): HistoryTime {
  return (
    daysFromCivil(moment) +
    ((moment.hour ?? 0) * 60 + (moment.minute ?? 0)) / MINUTES_PER_DAY
  );
}

// Rounded to the nearest minute, so a moment a hair before midnight reads as the next day's
// 00:00, never as 23:60
export function fromHistoryTime(t: HistoryTime): HistoryMoment {
  const totalMinutes = Math.round(t * MINUTES_PER_DAY);
  const day = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const minuteOfDay = totalMinutes - day * MINUTES_PER_DAY;
  return {
    ...civilFromDays(day),
    hour: Math.floor(minuteOfDay / 60),
    minute: minuteOfDay % 60,
  };
}

export function formatHistoryTime(
  t: HistoryTime,
  display: HistoryDisplay
): string {
  const m = fromHistoryTime(t);
  const month = MONTH_NAMES[m.month - 1];
  if (display === "months") return `${month} ${m.year}`;
  if (display === "days") return `${m.day} ${month} ${m.year}`;
  return `${m.day} ${month} ${m.year}, ${pad(m.hour)}:${pad(m.minute)}`;
}

// A length of history in words: "3 days", "1 day 12 hours", "2 hours 15 minutes"
export function formatDuration(days: number): string {
  const totalMinutes = Math.round(Math.max(days, 0) * MINUTES_PER_DAY);
  const d = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const h = Math.floor((totalMinutes % MINUTES_PER_DAY) / 60);
  const m = totalMinutes % 60;

  const parts: string[] = [];
  if (d) parts.push(`${d} day${d === 1 ? "" : "s"}`);
  if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m || parts.length === 0) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  return parts.join(" ");
}

export interface HistoryTick {
  time: HistoryTime;
  label: string;
}

// Steps measured in days: hours, quarter days, days, weeks
const CLOCK_STEPS: { days: number; label: (m: HistoryMoment) => string }[] = [
  { days: HOUR, label: (m) => `${pad(m.hour)}:${pad(m.minute)}` },
  { days: 6 * HOUR, label: (m) => `${pad(m.hour)}:${pad(m.minute)}` },
  { days: 1, label: (m) => `${m.day} ${shortMonth(m.month)}` },
  { days: 7, label: (m) => `${m.day} ${shortMonth(m.month)}` },
];

// Steps measured in calendar months, so ticks land on the 1st: 1, 3 and 6 months, then
// 1, 5, 10, 50 and 100 years
const MONTH_STEPS = [1, 3, 6, 12, 60, 120, 600, 1200];
const AVERAGE_MONTH_DAYS = 365.2425 / 12;

// Ticks for a ruler showing `from` to `to`: the finest step that gives no more than
// `maxTicks`, so it reads in hours when zoomed right in and in centuries when zoomed right out
export function historyTicks(
  from: HistoryTime,
  to: HistoryTime,
  maxTicks: number
): HistoryTick[] {
  const span = to - from;
  if (!(span > 0) || maxTicks < 1) return [];

  for (const step of CLOCK_STEPS) {
    if (span / step.days > maxTicks) continue;
    const ticks: HistoryTick[] = [];
    for (
      let i = Math.ceil(from / step.days - 1e-9);
      i * step.days <= to + 1e-9;
      i++
    ) {
      const time = i * step.days;
      ticks.push({ time, label: step.label(fromHistoryTime(time)) });
    }
    return ticks;
  }

  const first = fromHistoryTime(from);
  const coarsest = MONTH_STEPS[MONTH_STEPS.length - 1];
  for (const months of MONTH_STEPS) {
    if (span / (months * AVERAGE_MONTH_DAYS) > maxTicks && months !== coarsest)
      continue;

    let index = first.year * 12 + (first.month - 1);
    if (
      toHistoryTime({ year: first.year, month: first.month, day: 1 }) <
      from - 1e-9
    )
      index++;
    while (index % months !== 0) index++;

    const ticks: HistoryTick[] = [];
    for (;;) {
      const year = Math.floor(index / 12);
      const month = (index % 12) + 1;
      const time = toHistoryTime({ year, month, day: 1 });
      if (time > to + 1e-9) break;
      ticks.push({
        time,
        label: months >= 12 ? `${year}` : `${shortMonth(month)} ${year}`,
      });
      index += months;
    }
    return ticks;
  }
  return [];
}
