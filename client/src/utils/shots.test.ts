import { Shot } from "../types";
import {
  clampShot,
  dateHiddenAt,
  dropIndex,
  formatSeconds,
  historyAt,
  isHeld,
  MIN_SHOT_SECONDS,
  moveShot,
  nextShotName,
  parseShots,
  shotAt,
  shotStart,
  shotStarts,
  videoLength,
  videoMoment,
} from "./shots";

const S = 1000; // a moment in history, in days

const shot = (
  id: string,
  seconds: number,
  from: number,
  to: number,
  extra: Partial<Shot> = {}
): Shot => ({
  id,
  name: id,
  seconds,
  from: S + from,
  to: S + to,
  ...extra,
});

// Hastings for 10 s (14 days), a 4 s held title, then back to Stamford Bridge for 6 s
const shots = [
  shot("a", 10, 0, 14),
  shot("b", 4, 14, 14),
  shot("c", 6, -20, -17),
];

test("the video is the shots back to back", () => {
  expect(videoLength(shots)).toBe(20);
  expect(shotStarts(shots)).toEqual([0, 10, 14]);
  expect(shotStart(shots, "c")).toBe(14);
  expect(shotStart(shots, "nope")).toBeNull();
});

test("each moment of the video belongs to one shot, a cut to the shot that starts there", () => {
  expect(shotAt(shots, 5)).toMatchObject({ index: 0, start: 0, local: 5 });
  expect(shotAt(shots, 10)).toMatchObject({ index: 1, start: 10, local: 0 });
  expect(shotAt(shots, 15)).toMatchObject({ index: 2, local: 1 });
  // Before the start and past the end hold the first and last frames
  expect(shotAt(shots, -3)).toMatchObject({ index: 0, local: 0 });
  expect(shotAt(shots, 99)).toMatchObject({ index: 2, local: 6 });
  expect(shotAt([], 1)).toBeNull();
});

test("history runs steadily through a shot, holds in a held one, and jumps at a cut", () => {
  expect(historyAt(shots, 0)).toBeCloseTo(S, 9);
  expect(historyAt(shots, 5)).toBeCloseTo(S + 7, 9);
  expect(historyAt(shots, 11)).toBeCloseTo(S + 14, 9);
  expect(historyAt(shots, 13.9)).toBeCloseTo(S + 14, 9);
  expect(historyAt(shots, 14)).toBeCloseTo(S - 20, 9);
  expect(historyAt(shots, 20)).toBeCloseTo(S - 17, 9);
  expect(historyAt([], 3)).toBeNull();
  expect(isHeld(shots[1])).toBe(true);
  expect(isHeld(shots[0])).toBe(false);
});

test("an eased shot starts and ends slowly but reaches the same moments", () => {
  const eased = [shot("e", 10, 0, 10, { ease: true })];
  const steady = [shot("s", 10, 0, 10)];
  expect(historyAt(eased, 0.5)!).toBeLessThan(historyAt(steady, 0.5)!);
  expect(historyAt(eased, 5)).toBeCloseTo(S + 5, 6);
  expect(historyAt(eased, 9.5)!).toBeGreaterThan(historyAt(steady, 9.5)!);
  expect(historyAt(eased, 10)).toBeCloseTo(S + 10, 9);
});

test("a shot is never shorter than the minimum, and its history never runs backwards", () => {
  expect(clampShot(shot("x", 0, 0, 1)).seconds).toBe(MIN_SHOT_SECONDS);
  const turned = clampShot(shot("y", 5, 9, 2));
  expect([turned.from, turned.to]).toEqual([S + 2, S + 9]);
});

test("shots are named after the highest number used", () => {
  expect(nextShotName([])).toBe("Shot 1");
  expect(nextShotName([shot("Shot 4", 1, 0, 1), shot("Battle", 1, 0, 1)])).toBe(
    "Shot 5"
  );
});

test("moving a shot changes the running order", () => {
  expect(moveShot(shots, "c", 0).map((s) => s.id)).toEqual(["c", "a", "b"]);
  expect(moveShot(shots, "a", 9).map((s) => s.id)).toEqual(["b", "c", "a"]);
  expect(moveShot(shots, "b", 1)).toBe(shots);
  expect(moveShot(shots, "nope", 0)).toBe(shots);
});

test("saved shots are read back, dropping anything unusable", () => {
  const parsed = parseShots([
    {
      id: "a",
      name: "Hastings",
      seconds: 10,
      from: S,
      to: S + 1,
      ease: true,
      hideDate: "yes",
    },
    { id: "b", name: "  ", seconds: 0.1, from: S, to: S },
    { id: "c", seconds: "ten", from: S, to: S },
    null,
  ]);
  expect(parsed).toEqual([
    { id: "a", name: "Hastings", seconds: 10, from: S, to: S + 1, ease: true },
    { id: "b", name: "Shot", seconds: MIN_SHOT_SECONDS, from: S, to: S },
  ]);
  expect(parseShots("nope")).toEqual([]);
});

test("video times read as m:ss, with tenths only when needed", () => {
  expect(formatSeconds(0)).toBe("0:00");
  expect(formatSeconds(75)).toBe("1:15");
  expect(formatSeconds(10.5)).toBe("0:10.5");
  expect(formatSeconds(600.04)).toBe("10:00");
});

test("a dragged shot lands between the shots either side of the pointer", () => {
  // a: 0-10, b: 10-14, c: 14-20 (middles at 5, 12 and 17)
  expect(dropIndex(shots, "c", 1)).toBe(0);
  expect(dropIndex(shots, "c", 8)).toBe(1);
  expect(dropIndex(shots, "a", 13)).toBe(1);
  expect(dropIndex(shots, "a", 19)).toBe(2);
});

test("the playhead follows the video, at the story's start when there's nothing later", () => {
  expect(videoMoment(shots, 5, S - 100)).toBeCloseTo(S + 7, 9);
  // A shot showing the story's start, or earlier, puts the playhead at the start (null)
  expect(videoMoment(shots, 15, S)).toBeNull();
  expect(videoMoment([], 5, S)).toBeNull();
});

test("a shot can hide the on-screen date while it is on screen", () => {
  const titled = [shot("a", 10, 0, 1), shot("t", 5, 1, 1, { hideDate: true })];
  expect(dateHiddenAt(titled, 4)).toBe(false);
  expect(dateHiddenAt(titled, 12)).toBe(true);
  expect(dateHiddenAt([], 0)).toBe(false);
});
