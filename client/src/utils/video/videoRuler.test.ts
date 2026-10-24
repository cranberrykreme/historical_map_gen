import { secondsTicks } from "./videoRuler";

const labels = (from: number, to: number, max: number) =>
  secondsTicks(from, to, max).map((tick) => tick.label);

test("a short stretch reads in seconds", () => {
  expect(labels(0, 10, 6)).toEqual([
    "0:00",
    "0:02",
    "0:04",
    "0:06",
    "0:08",
    "0:10",
  ]);
});

test("a long video reads in minutes", () => {
  expect(labels(0, 600, 6)).toEqual([
    "0:00",
    "2:00",
    "4:00",
    "6:00",
    "8:00",
    "10:00",
  ]);
});

test("zoomed right in, it reads in half seconds, starting at the first tick in view", () => {
  expect(labels(1.2, 3, 5)).toEqual(["0:01.5", "0:02", "0:02.5", "0:03"]);
});

test("nothing to show gives no ticks", () => {
  expect(secondsTicks(5, 5, 10)).toEqual([]);
  expect(secondsTicks(0, 10, 0)).toEqual([]);
});
