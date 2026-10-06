import { DateMarker } from "../types";
import {
  civilFromDays,
  clampDate,
  dateAtTime,
  daysFromCivil,
  daysInMonth,
  formatDate,
  isLeapYear,
} from "./dates";

const marker = (
  time: number,
  year: number,
  month: number,
  day: number,
  id = `m${time}`
): DateMarker => ({ id, time, year, month, day });

test("days are counted from 1 January 1970", () => {
  expect(daysFromCivil({ year: 1970, month: 1, day: 1 })).toBe(0);
  expect(daysFromCivil({ year: 1970, month: 1, day: 2 })).toBe(1);
  expect(daysFromCivil({ year: 1969, month: 12, day: 31 })).toBe(-1);
  expect(daysFromCivil({ year: 1971, month: 1, day: 1 })).toBe(365);
  expect(daysFromCivil({ year: 2000, month: 1, day: 1 })).toBe(10957);
});

test("every day round-trips through the calendar, across leap and non-leap years", () => {
  const first = daysFromCivil({ year: 1064, month: 1, day: 1 });
  for (let n = 0; n < 1500; n++) {
    const date = civilFromDays(first + n);
    expect(date.day).toBeGreaterThanOrEqual(1);
    expect(date.day).toBeLessThanOrEqual(daysInMonth(date.year, date.month));
    expect(daysFromCivil(date)).toBe(first + n);
  }

  const hastings = { year: 1066, month: 10, day: 14 };
  expect(civilFromDays(daysFromCivil(hastings))).toEqual(hastings);
});

test("leap years and the length of a month", () => {
  expect(isLeapYear(2000)).toBe(true);
  expect(isLeapYear(1900)).toBe(false);
  expect(isLeapYear(1104)).toBe(true);
  expect(isLeapYear(1100)).toBe(false);

  expect(daysInMonth(1066, 2)).toBe(28);
  expect(daysInMonth(1104, 2)).toBe(29);
  expect(daysInMonth(1066, 4)).toBe(30);
  expect(daysInMonth(1066, 1)).toBe(31);

  expect(
    civilFromDays(daysFromCivil({ year: 1100, month: 2, day: 28 }) + 1)
  ).toEqual({
    year: 1100,
    month: 3,
    day: 1,
  });
  expect(
    civilFromDays(daysFromCivil({ year: 1104, month: 2, day: 28 }) + 1)
  ).toEqual({
    year: 1104,
    month: 2,
    day: 29,
  });
});

test("clampDate makes a date valid", () => {
  expect(clampDate({ year: 1066, month: 13, day: 40 })).toEqual({
    year: 1066,
    month: 12,
    day: 31,
  });
  expect(clampDate({ year: 1066, month: 2, day: 31 })).toEqual({
    year: 1066,
    month: 2,
    day: 28,
  });
  expect(clampDate({ year: 1104, month: 2, day: 31 })).toEqual({
    year: 1104,
    month: 2,
    day: 29,
  });
  expect(clampDate({ year: 0, month: 0, day: 0 })).toEqual({
    year: 1,
    month: 1,
    day: 1,
  });
  expect(clampDate({ year: 12000, month: 6, day: 15 })).toEqual({
    year: 9999,
    month: 6,
    day: 15,
  });
  expect(clampDate({ year: 1066.4, month: 9.6, day: 14.2 })).toEqual({
    year: 1066,
    month: 10,
    day: 14,
  });
});

test("a date is shown as month and year, or with the day too", () => {
  const date = { year: 1066, month: 10, day: 14 };
  expect(formatDate(date, "months")).toBe("October 1066");
  expect(formatDate(date, "days")).toBe("14 October 1066");
});

test("with no markers there is no date, and outside them the nearest marker's date holds", () => {
  expect(dateAtTime([], 5)).toBeNull();

  const markers = [marker(5, 1066, 9, 28), marker(15, 1066, 10, 14)];
  expect(dateAtTime(markers, 0)).toEqual({ year: 1066, month: 9, day: 28 });
  expect(dateAtTime(markers, 5)).toEqual({ year: 1066, month: 9, day: 28 });
  expect(dateAtTime(markers, 15)).toEqual({ year: 1066, month: 10, day: 14 });
  expect(dateAtTime(markers, 99)).toEqual({ year: 1066, month: 10, day: 14 });
});

test("between two markers the date moves a whole number of days at a time", () => {
  const markers = [marker(0, 1066, 1, 1), marker(10, 1067, 1, 1)];

  // 365 days over 10 seconds: halfway is day 182, which is 2 July
  expect(dateAtTime(markers, 5)).toEqual({ year: 1066, month: 7, day: 2 });
  expect(formatDate(dateAtTime(markers, 5)!, "months")).toBe("July 1066");
  expect(dateAtTime(markers, 9.99)).toEqual({ year: 1066, month: 12, day: 31 });
});

test("markers do not need to be in order, and two at the same time do not break it", () => {
  const markers = [
    marker(10, 1067, 1, 1),
    marker(0, 1066, 1, 1),
    marker(10, 1068, 1, 1, "twin"),
  ];

  expect(dateAtTime(markers, 5)).toEqual({ year: 1066, month: 7, day: 2 });
  expect(dateAtTime(markers, 10)?.year).toBe(1068);
});
