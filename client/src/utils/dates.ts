import { DateMarker, DateMode } from "../types";

export interface CalendarDate {
  year: number;
  month: number; // 1 to 12
  day: number; // 1 to 31
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MIN_YEAR = 1;
const MAX_YEAR = 9999;

export const isLeapYear = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

// Makes a date valid: a whole year in range, a month from 1 to 12, a day that exists
export function clampDate(date: CalendarDate): CalendarDate {
  const year = Math.min(Math.max(Math.round(date.year), MIN_YEAR), MAX_YEAR);
  const month = Math.min(Math.max(Math.round(date.month), 1), 12);
  const day = Math.min(
    Math.max(Math.round(date.day), 1),
    daysInMonth(year, month)
  );
  return { year, month, day };
}

// Days since 1 January 1970, counting the Gregorian calendar backwards for earlier years
// (Howard Hinnant's civil-days algorithm). Whole days only, so no time zones or daylight
// saving to get in the way.
export function daysFromCivil({ year, month, day }: CalendarDate): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const monthFromMarch = (month + 9) % 12;
  const dayOfYear = Math.floor((153 * monthFromMarch + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 +
    Math.floor(yearOfEra / 4) -
    Math.floor(yearOfEra / 100) +
    dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

export function civilFromDays(days: number): CalendarDate {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const dayOfEra = z - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365
  );
  const y = yearOfEra + era * 400;
  const dayOfYear =
    dayOfEra -
    (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const monthFromMarch = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * monthFromMarch + 2) / 5) + 1;
  const month = monthFromMarch < 10 ? monthFromMarch + 3 : monthFromMarch - 9;
  return { year: month <= 2 ? y + 1 : y, month, day };
}

// "October 1066" (months) or "14 October 1066" (days)
export function formatDate(date: CalendarDate, mode: DateMode): string {
  const month = MONTH_NAMES[date.month - 1];
  return mode === "days"
    ? `${date.day} ${month} ${date.year}`
    : `${month} ${date.year}`;
}

// The date to show at a moment on the timeline: the first marker's date before it, the last
// marker's after it, and in between the date moves a whole number of days at a time.
// Null when there are no markers.
export function dateAtTime(
  markers: DateMarker[],
  time: number
): CalendarDate | null {
  if (markers.length === 0) return null;
  const sorted = [...markers].sort((a, b) => a.time - b.time);
  const toDate = (m: DateMarker): CalendarDate => ({
    year: m.year,
    month: m.month,
    day: m.day,
  });

  if (time <= sorted[0].time) return toDate(sorted[0]);
  const last = sorted[sorted.length - 1];
  if (time >= last.time) return toDate(last);

  let i = 0;
  while (sorted[i + 1].time <= time) i++;
  const before = sorted[i];
  const after = sorted[i + 1];

  const span = after.time - before.time;
  const t = span <= 0 ? 1 : (time - before.time) / span;
  const from = daysFromCivil(toDate(before));
  const to = daysFromCivil(toDate(after));
  return civilFromDays(Math.floor(from + (to - from) * t));
}
