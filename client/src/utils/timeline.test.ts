import { MapPath, PathPoint, Unit } from "../types";
import { attachUnits } from "./formation";
import {
  createPlayback,
  easeTravel,
  PIVOT_DEGREES_PER_UNIT,
} from "./pathPlayback";
import {
  chainedPathIds,
  clampTiming,
  createTimeline,
  DEFAULT_PACE,
  dragTiming,
  formatTime,
  getTimeline,
  handoverUnits,
  MIN_MOVEMENT_SECONDS,
  dragMarkerTime,
} from "./timeline";

const unit = (id: string, x: number, y: number): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 0,
  scale: 1,
});

function pathFor(
  id: string,
  points: PathPoint[],
  units: Unit[],
  timing: { start?: number; end?: number } = {}
): MapPath {
  const attachment = attachUnits(
    { id, name: id, points, assignments: [] },
    units
  )!;
  return { id, name: id, ...attachment, ...timing };
}

const east = [
  { x: 0, y: 0 },
  { x: 1000, y: 0 },
];
const south = [
  { x: 0, y: 0 },
  { x: 0, y: 1000 },
];

test("a movement with no stored timing starts at 0 and lasts as long as the march takes", () => {
  const units = [unit("a", 0, 0)];
  const path = pathFor("p", east, units);
  const timeline = createTimeline([path], units);
  const timing = timeline.timings.get("p")!;

  expect(timing.start).toBe(0);
  expect(timing.end).toBeCloseTo(
    createPlayback(path, units).length / DEFAULT_PACE,
    1
  );
  expect(timeline.duration).toBe(timing.end);
});

test("a stored timing is used as it is", () => {
  const units = [unit("a", 0, 0)];
  const path = pathFor("p", east, units, { start: 2, end: 6 });
  const timeline = createTimeline([path], units);

  expect(timeline.timings.get("p")).toEqual({ start: 2, end: 6 });
  expect(timeline.duration).toBe(6);
});

test("units wait at their placed spot, travel during the movement, then stay at the end", () => {
  const units = [unit("a", 0, 0)];
  const path = pathFor("p", east, units, { start: 2, end: 12 });
  const timeline = createTimeline([path], units);
  const playback = createPlayback(path, units);

  expect(timeline.stateAt(1).size).toBe(0); // not started: the unit stays where it was placed
  expect(timeline.stateAt(2).get("a")).toEqual(playback.stateAt(0).get("a"));
  expect(timeline.stateAt(7).get("a")).toEqual(playback.stateAt(0.5).get("a"));
  expect(timeline.stateAt(12).get("a")).toEqual(playback.stateAt(1).get("a"));
  expect(timeline.stateAt(99).get("a")).toEqual(playback.stateAt(1).get("a"));
});

test("when a unit has two movements, the one that started most recently drives it", () => {
  const units = [unit("a", 0, 0)];
  const first = pathFor("p1", east, units, { start: 0, end: 10 });
  const second = pathFor("p2", south, units, { start: 5, end: 15 });
  const timeline = createTimeline([first, second], units);

  // Until the second begins, the first one drives the unit
  expect(timeline.stateAt(4).get("a")).toEqual(
    createPlayback(first, units).stateAt(0.4).get("a")
  );

  // The second picks the unit up where the first had got to at time 5: 425 into its 1000 of
  // travelling (after 150 spent turning), which with the gentle start is a little short of
  // 425 along. It ends at its destination, offset by that much.
  const pickedUp = 1000 * easeTravel(425 / 1000);
  const end = timeline.stateAt(15).get("a")!;
  expect(end.x).toBeCloseTo(pickedUp, 3);
  expect(end.y).toBeCloseTo(1000, 3);
});

test("a draft timing overrides a stored one for that movement only", () => {
  const units = [unit("a", 0, 0)];
  const path = pathFor("p", east, units, { start: 0, end: 10 });
  const timeline = createTimeline([path], units);
  const playback = createPlayback(path, units);

  const overrides = new Map([["p", { start: 6, end: 8 }]]);
  expect(timeline.stateAt(7, overrides).get("a")).toEqual(
    playback.stateAt(0.5).get("a")
  );
  expect(timeline.stateAt(7).get("a")).toEqual(playback.stateAt(0.7).get("a"));
});

test("paths with no attached units, or no route, are not movements", () => {
  const timeline = createTimeline(
    [
      { id: "x", name: "x", points: east, assignments: [] },
      {
        id: "y",
        name: "y",
        points: [{ x: 0, y: 0 }],
        assignments: [{ unitId: "a", forward: 0, right: 0 }],
      },
    ],
    [unit("a", 0, 0)]
  );

  expect(timeline.timings.size).toBe(0);
  expect(timeline.duration).toBe(0);
  expect(timeline.stateAt(5).size).toBe(0);
});

test("the same paths and units share one built timeline", () => {
  const units = [unit("a", 0, 0)];
  const paths = [pathFor("p", east, units)];
  const built = getTimeline(paths, units);

  expect(getTimeline(paths, units)).toBe(built);
  expect(getTimeline([...paths], units)).not.toBe(built);
});

test("dragging a bar moves it, snapping to tenths and staying within the view", () => {
  const timing = { start: 2, end: 6 };
  expect(dragTiming(timing, 1.04, "move", 20)).toEqual({ start: 3, end: 7 });
  expect(dragTiming(timing, -5, "move", 20)).toEqual({ start: 0, end: 4 });
  expect(dragTiming(timing, 99, "move", 20)).toEqual({ start: 16, end: 20 });
});

test("dragging the left end changes the start but never passes the minimum length", () => {
  const timing = { start: 2, end: 6 };
  expect(dragTiming(timing, 1.02, "start", 20)).toEqual({ start: 3, end: 6 });
  expect(dragTiming(timing, -99, "start", 20)).toEqual({ start: 0, end: 6 });
  expect(dragTiming(timing, 99, "start", 20).start).toBeCloseTo(
    6 - MIN_MOVEMENT_SECONDS,
    6
  );
});

test("dragging the right end changes the end but never passes the minimum length or the view", () => {
  const timing = { start: 2, end: 6 };
  expect(dragTiming(timing, 2.04, "end", 20)).toEqual({ start: 2, end: 8 });
  expect(dragTiming(timing, -99, "end", 20).end).toBeCloseTo(
    2 + MIN_MOVEMENT_SECONDS,
    6
  );
  expect(dragTiming(timing, 99, "end", 20).end).toBe(20);
});

test("a timing cannot start before 0 or be shorter than the minimum", () => {
  expect(clampTiming(-3, 1)).toEqual({ start: 0, end: 1 });
  expect(clampTiming(4, 4.1)).toEqual({
    start: 4,
    end: 4 + MIN_MOVEMENT_SECONDS,
  });
});

test("formatTime shows minutes, seconds and tenths", () => {
  expect(formatTime(0)).toBe("0:00.0");
  expect(formatTime(12.4)).toBe("0:12.4");
  expect(formatTime(75.3)).toBe("1:15.3");
  expect(formatTime(59.96)).toBe("1:00.0");
  expect(formatTime(-5)).toBe("0:00.0");
});

test("a second movement picks its units up where the first one leaves them", () => {
  const units = [unit("a", 0, 0)];
  const first = pathFor("p1", east, units, { start: 0, end: 10 });
  const second = {
    ...pathFor("p2", south, units, { start: 10, end: 20 }),
    // drawn from where the first march ends
    points: [
      { x: 1000, y: 0 },
      { x: 1000, y: 1000 },
    ],
  };
  const timeline = createTimeline([first, second], units);

  // At the handover the unit is where the first march ended, facing east
  const handover = timeline.stateAt(10).get("a")!;
  expect(handover.x).toBeCloseTo(1000, 3);
  expect(handover.y).toBeCloseTo(0, 3);
  expect(handover.rotation).toBeCloseTo(90, 3);

  // It turns on the spot from that facing to face south, without moving
  // (150 to turn, then 1000 to travel, fitted into 10 seconds)
  const turning = timeline.stateAt(10.5).get("a")!;
  expect(turning.x).toBeCloseTo(1000, 3);
  expect(turning.y).toBeCloseTo(0, 3);
  expect(turning.rotation).toBeCloseTo(
    90 + 0.05 * 1150 * PIVOT_DEGREES_PER_UNIT,
    2
  );

  const end = timeline.stateAt(20).get("a")!;
  expect(end.x).toBeCloseTo(1000, 3);
  expect(end.y).toBeCloseTo(1000, 3);
});

test("a movement is chained when an earlier one drives any of its units", () => {
  const units = [unit("a", 0, 0), unit("b", 100, 0)];
  const one = pathFor("one", east, [units[0]], { start: 0, end: 5 });
  const two = pathFor("two", south, [units[0]], { start: 5, end: 10 });
  const other = pathFor("other", east, [units[1]], { start: 5, end: 10 });

  expect(Array.from(chainedPathIds([one, two, other]))).toEqual(["two"]);
});

test("movements that start together and share a unit chain in list order", () => {
  const units = [unit("a", 0, 0)];
  const one = pathFor("one", east, units);
  const two = pathFor("two", south, units);

  expect(Array.from(chainedPathIds([one, two]))).toEqual(["two"]);
  expect(Array.from(chainedPathIds([two, one]))).toEqual(["one"]);
});

test("units are handed over where their earlier movements leave them", () => {
  const units = [unit("a", 0, 0), unit("b", 500, 500)];
  const first = pathFor("p1", east, [units[0]], { start: 0, end: 10 });

  const handover = handoverUnits([first], units, units);
  expect(handover.time).toBe(10);
  const a = handover.units.find((u) => u.id === "a")!;
  const b = handover.units.find((u) => u.id === "b")!;
  expect(a.x).toBeCloseTo(1000, 3);
  expect(b.x).toBe(500); // never marched, so it stays where it was placed
  expect(b.y).toBe(500);

  expect(handoverUnits([], units, units)).toEqual({ units, time: null });
});

test("dragging a date marker snaps to tenths and stays within the view", () => {
  expect(dragMarkerTime(2, 1.04, 20)).toBe(3);
  expect(dragMarkerTime(2, -5, 20)).toBe(0);
  expect(dragMarkerTime(2, 99, 20)).toBe(20);
});
