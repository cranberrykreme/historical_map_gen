import {
  allowedStoryStart,
  durationFields,
  fromDurationFields,
  fromMomentFields,
  momentFields,
  pathShownAt,
} from "./historyEdit";
import { HOUR, MINUTE, toHistoryTime } from "./historyTime";

const D = toHistoryTime({ year: 1066, month: 9, day: 20 });

test("a moment splits into fields and comes back unchanged", () => {
  const t = toHistoryTime({
    year: 1066,
    month: 10,
    day: 14,
    hour: 9,
    minute: 30,
  });
  expect(momentFields(t)).toEqual({
    year: 1066,
    month: 10,
    day: 14,
    hour: 9,
    minute: 30,
  });
  expect(fromMomentFields(momentFields(t))).toBeCloseTo(t, 9);
});

test("typed fields out of range are pulled back in", () => {
  // 31 February 1066 is the last day of February; hours and minutes stay on the clock
  expect(
    fromMomentFields({ year: 1066, month: 2, day: 31, hour: 30, minute: -5 })
  ).toBeCloseTo(
    toHistoryTime({ year: 1066, month: 2, day: 28, hour: 23, minute: 0 }),
    9
  );
  expect(
    momentFields(
      fromMomentFields({ year: 1066, month: 13, day: 0, hour: 0, minute: 75 })
    )
  ).toEqual({ year: 1066, month: 12, day: 1, hour: 0, minute: 59 });
});

test("a length splits into days, hours and minutes, and typed parts add up", () => {
  expect(durationFields(1.5)).toEqual({ days: 1, hours: 12, minutes: 0 });
  expect(durationFields(2 * HOUR + 15 * MINUTE)).toEqual({
    days: 0,
    hours: 2,
    minutes: 15,
  });
  expect(durationFields(-1)).toEqual({ days: 0, hours: 0, minutes: 0 });

  expect(fromDurationFields({ days: 0, hours: 36, minutes: 0 })).toBeCloseTo(
    1.5,
    9
  );
  expect(fromDurationFields({ days: 1, hours: -3, minutes: 30 })).toBeCloseTo(
    1 + 30 * MINUTE,
    9
  );
  expect(fromDurationFields(durationFields(3.25))).toBeCloseTo(3.25, 9);
});

test("past the story's start a path shows only while its march is under way", () => {
  const march = { start: D + 2, end: D + 5 };
  expect(pathShownAt(march, null)).toBe(true); // at the start, everything shows
  expect(pathShownAt(march, D + 1)).toBe(false);
  expect(pathShownAt(march, D + 2)).toBe(true);
  expect(pathShownAt(march, D + 5)).toBe(true);
  expect(pathShownAt(march, D + 6)).toBe(false);
  expect(pathShownAt(undefined, D + 6)).toBe(true); // no march yet
});

test("the story can't start after its first march begins", () => {
  expect(allowedStoryStart(D + 10, D + 2)).toBe(D + 2);
  expect(allowedStoryStart(D - 10, D + 2)).toBe(D - 10);
  expect(allowedStoryStart(D + 10, null)).toBe(D + 10);
});
