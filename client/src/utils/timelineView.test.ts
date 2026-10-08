import { toHistoryTime } from "./historyTime";
import {
  barPlacement,
  MIN_VIEW_DAYS,
  validMarch,
  viewShowing,
} from "./timeline";

const D = toHistoryTime({ year: 1066, month: 9, day: 20 });

test("a bar is before, inside or after the stretch on show", () => {
  const view = { from: D, to: D + 10 };
  expect(barPlacement({ start: D - 5, end: D - 1, turn: 0 }, view)).toBe(
    "before"
  );
  expect(barPlacement({ start: D - 5, end: D + 1, turn: 0 }, view)).toBe(
    "inside"
  );
  expect(barPlacement({ start: D + 9, end: D + 20, turn: 0 }, view)).toBe(
    "inside"
  );
  expect(barPlacement({ start: D + 11, end: D + 12, turn: 0 }, view)).toBe(
    "after"
  );
});

test("showing a march keeps the zoom and centres it, or zooms out just enough to fit it", () => {
  const view = { from: D, to: D + 10 };

  const short = viewShowing({ start: D + 100, end: D + 102, turn: 0 }, view);
  expect(short.to - short.from).toBeCloseTo(10, 9);
  expect((short.from + short.to) / 2).toBeCloseTo(D + 101, 9);

  const long = viewShowing({ start: D + 100, end: D + 150, turn: 0 }, view);
  expect(long.from).toBeLessThan(D + 100);
  expect(long.to).toBeGreaterThan(D + 150);

  const tiny = viewShowing(
    { start: D, end: D, turn: 0 },
    { from: D, to: D + MIN_VIEW_DAYS / 4 }
  );
  expect(tiny.to - tiny.from).toBeGreaterThanOrEqual(MIN_VIEW_DAYS - 1e-9);
});

test("a march with unusable dates counts as having none", () => {
  expect(validMarch(undefined)).toBeUndefined();
  expect(validMarch({ start: NaN, end: D, turn: 0 })).toBeUndefined();
  expect(validMarch({ start: D, end: Infinity, turn: 0 })).toBeUndefined();
  expect(validMarch({ start: D, end: D + 2, turn: NaN })).toEqual({
    start: D,
    end: D + 2,
    turn: 0,
  });
  expect(validMarch({ start: D, end: D + 2, turn: 1 })).toEqual({
    start: D,
    end: D + 2,
    turn: 1,
  });
});
