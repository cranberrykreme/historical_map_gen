import {
  formatDuration,
  formatHistoryTime,
  fromHistoryTime,
  historyTicks,
  HOUR,
  MINUTES_PER_DAY,
  toHistoryTime,
} from "./historyTime";

test("a moment survives the trip to history time and back, to the minute", () => {
  const moment = { year: 1066, month: 10, day: 14, hour: 9, minute: 30 };
  expect(fromHistoryTime(toHistoryTime(moment))).toEqual(moment);
  expect(toHistoryTime({ year: 1970, month: 1, day: 2, hour: 12 })).toBeCloseTo(
    1.5,
    10
  );
});

test("a moment just before midnight reads as the next day's midnight, never 23:60", () => {
  const nearlyMidnight =
    toHistoryTime({ year: 1066, month: 10, day: 14 }) +
    1 -
    1 / (MINUTES_PER_DAY * 100);
  expect(fromHistoryTime(nearlyMidnight)).toEqual({
    year: 1066,
    month: 10,
    day: 15,
    hour: 0,
    minute: 0,
  });
});

test("a moment reads as a month, a day, or a day and time", () => {
  const t = toHistoryTime({
    year: 1066,
    month: 10,
    day: 14,
    hour: 9,
    minute: 5,
  });
  expect(formatHistoryTime(t, "months")).toBe("October 1066");
  expect(formatHistoryTime(t, "days")).toBe("14 October 1066");
  expect(formatHistoryTime(t, "times")).toBe("14 October 1066, 09:05");
});

test("a length of history reads in days, hours and minutes", () => {
  expect(formatDuration(0)).toBe("0 minutes");
  expect(formatDuration(3)).toBe("3 days");
  expect(formatDuration(1.5)).toBe("1 day 12 hours");
  expect(formatDuration(2.25 * HOUR)).toBe("2 hours 15 minutes");
});

test("zoomed into a day, the ruler ticks every six hours", () => {
  const from = toHistoryTime({ year: 1066, month: 10, day: 14 });
  const ticks = historyTicks(from, from + 1, 10);

  expect(ticks.map((t) => t.label)).toEqual([
    "00:00",
    "06:00",
    "12:00",
    "18:00",
    "00:00",
  ]);
  expect(ticks[0].time).toBeCloseTo(from, 10);
});

test("across two years, the ruler ticks every quarter", () => {
  const ticks = historyTicks(
    toHistoryTime({ year: 1066, month: 1, day: 1 }),
    toHistoryTime({ year: 1068, month: 1, day: 1 }),
    10
  );

  expect(ticks.map((t) => t.label)).toEqual([
    "Jan 1066",
    "Apr 1066",
    "Jul 1066",
    "Oct 1066",
    "Jan 1067",
    "Apr 1067",
    "Jul 1067",
    "Oct 1067",
    "Jan 1068",
  ]);
});

test("across centuries, the ruler ticks in round years", () => {
  const ticks = historyTicks(
    toHistoryTime({ year: 1000, month: 1, day: 1 }),
    toHistoryTime({ year: 1300, month: 1, day: 1 }),
    10
  );

  expect(ticks.map((t) => t.label)).toEqual([
    "1000",
    "1050",
    "1100",
    "1150",
    "1200",
    "1250",
    "1300",
  ]);
});

test("a ruler with no span has no ticks", () => {
  const t = toHistoryTime({ year: 1066, month: 10, day: 14 });
  expect(historyTicks(t, t, 10)).toEqual([]);
});
