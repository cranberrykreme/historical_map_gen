import { MapPath, MarchTiming, PathPoint, Unit } from "../types";
import { attachUnits } from "./formation";
import { HOUR, MINUTE, toHistoryTime } from "./historyTime";
import { createPlayback, easeTravel } from "./pathPlayback";
import {
  chainedPathIds,
  createTimeline,
  DEFAULT_MARCH_PACE,
  defaultMarch,
  existsAt,
  fitView,
  getTimeline,
  handoverUnits,
  keepAfter,
  MAX_VIEW_DAYS,
  MIN_DEFAULT_MARCH,
  MIN_VIEW_DAYS,
  snapStepFor,
  zoomView,
} from "./timeline";

const unit = (
  id: string,
  x: number,
  y: number,
  extra: Partial<Unit> = {}
): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 0,
  scale: 1,
  ...extra,
});

function pathFor(
  id: string,
  points: PathPoint[],
  units: Unit[],
  march?: MarchTiming
): MapPath {
  const attachment = attachUnits(
    { id, name: id, points, assignments: [] },
    units
  )!;
  return { id, name: id, ...attachment, march };
}

// 20 September 1066, midnight
const D = toHistoryTime({ year: 1066, month: 9, day: 20 });

const east = [
  { x: 0, y: 0 },
  { x: 1000, y: 0 },
];
const south = [
  { x: 0, y: 0 },
  { x: 0, y: 1000 },
];

test("a new march lasts as long as its run takes at the default pace, turn included", () => {
  const units = [unit("a", 0, 0)]; // faces north, so it turns 90° (150 of run) to head east
  const playback = createPlayback(pathFor("p", east, units), units);
  const march = defaultMarch(playback, D);

  expect(march.start).toBe(D);
  expect(march.end - D).toBeCloseTo(1150 / DEFAULT_MARCH_PACE, 2); // 11.5 days
  expect(march.turn).toBeCloseTo(1.5, 2);

  // A very short run still lasts a while
  const facingEast = [unit("b", 0, 0, { rotation: 90 })];
  const tiny = createPlayback(
    pathFor(
      "q",
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      facingEast
    ),
    facingEast
  );
  expect(defaultMarch(tiny, D).end - D).toBeCloseTo(MIN_DEFAULT_MARCH, 10);
});

test("a march's dates are used as they are, and the timeline knows when the story's marches begin and end", () => {
  const units = [unit("a", 0, 0)];
  const march = { start: D + 2, end: D + 6, turn: 0.5 };
  const timeline = createTimeline([pathFor("p", east, units, march)], units);

  expect(timeline.timings.get("p")).toEqual(march);
  expect(timeline.start).toBe(D + 2);
  expect(timeline.end).toBe(D + 6);

  const empty = createTimeline([], units);
  expect(empty.start).toBeNull();
  expect(empty.end).toBeNull();
});

test("units wait where they were placed, turn, travel, then stay at the end", () => {
  const units = [unit("a", 0, 0)];
  const timeline = createTimeline(
    [pathFor("p", east, units, { start: D, end: D + 11.5, turn: 1.5 })],
    units
  );

  expect(timeline.stateAt(D - 1).has("a")).toBe(false);

  const turning = timeline.stateAt(D + 0.75).get("a")!;
  expect(turning.x).toBeCloseTo(0, 6);
  expect(turning.rotation).toBeCloseTo(45, 4);

  const halfway = timeline.stateAt(D + 1.5 + 5).get("a")!;
  expect(halfway.x).toBeCloseTo(1000 * easeTravel(0.5), 3);
  expect(halfway.rotation).toBeCloseTo(90, 4);

  expect(timeline.stateAt(D + 20).get("a")!.x).toBeCloseTo(1000, 3);
});

test("a longer turn is a slower turn, and the travel keeps its own share", () => {
  const units = [unit("a", 0, 0)];
  const timeline = createTimeline(
    [pathFor("p", east, units, { start: D, end: D + 13, turn: 3 })],
    units
  );

  expect(timeline.stateAt(D + 1.5).get("a")!.rotation).toBeCloseTo(45, 4);
  expect(timeline.stateAt(D + 3).get("a")!.x).toBeCloseTo(0, 6);
  expect(timeline.stateAt(D + 8).get("a")!.x).toBeCloseTo(
    1000 * easeTravel(0.5),
    3
  );
});

test("when a unit has two marches, the one that started most recently drives it", () => {
  const units = [unit("a", 0, 0)];
  const first = pathFor("first", east, units, {
    start: D,
    end: D + 11.5,
    turn: 1.5,
  });
  const second = pathFor("second", south, units, {
    start: D + 5,
    end: D + 15,
    turn: 1,
  });
  const timeline = createTimeline([first, second], units);

  // The second picks the unit up where the first had got to on day 5: 35% of the way
  // through its travel
  const pickedUp = 1000 * easeTravel(0.35);
  const atHandover = timeline.stateAt(D + 5).get("a")!;
  expect(atHandover.x).toBeCloseTo(pickedUp, 3);
  expect(atHandover.y).toBeCloseTo(0, 3);

  const end = timeline.stateAt(D + 15).get("a")!;
  expect(end.x).toBeCloseTo(pickedUp, 3);
  expect(end.y).toBeCloseTo(1000, 3);
});

test("a draft timing overrides a stored one for that march only", () => {
  const units = [unit("a", 0, 0), unit("b", 0, 500)];
  const p = pathFor("p", east, [units[0]], { start: D, end: D + 10, turn: 0 });
  const q = pathFor(
    "q",
    east.map((pt) => ({ x: pt.x, y: 500 })),
    [units[1]],
    {
      start: D,
      end: D + 10,
      turn: 0,
    }
  );
  const timeline = createTimeline([p, q], units);

  const draft = new Map([["p", { start: D + 20, end: D + 30, turn: 0 }]]);
  const states = timeline.stateAt(D + 10, draft);
  expect(states.has("a")).toBe(false); // p hasn't started under its draft dates
  expect(states.get("b")!.x).toBeCloseTo(1000, 3);
});

test("paths with no attached units, or no route, are not marches", () => {
  const units = [unit("a", 0, 0)];
  const bare: MapPath = {
    id: "bare",
    name: "bare",
    points: east,
    assignments: [],
  };
  const dot: MapPath = {
    id: "dot",
    name: "dot",
    points: [{ x: 0, y: 0 }],
    assignments: [{ unitId: "a", forward: 0, right: 0 }],
  };
  const timeline = createTimeline([bare, dot], units);
  expect(timeline.timings.size).toBe(0);
});

test("the same paths and units share one built timeline", () => {
  const units = [unit("a", 0, 0)];
  const paths = [pathFor("p", east, units, { start: D, end: D + 1, turn: 0 })];
  expect(getTimeline(paths, units)).toBe(getTimeline(paths, units));
  expect(getTimeline([...paths], units)).not.toBe(getTimeline(paths, units));
});

test("units are handed over where their earlier marches leave them, when the last one ends", () => {
  const units = [unit("a", 0, 0)];
  const first = pathFor("first", east, units, {
    start: D,
    end: D + 11.5,
    turn: 1.5,
  });
  const handover = handoverUnits([first], units, units);

  expect(handover.time).toBe(D + 11.5);
  expect(handover.units[0].x).toBeCloseTo(1000, 3);
  expect(handover.units[0].rotation).toBeCloseTo(90, 4);

  expect(handoverUnits([], units, units)).toEqual({ units, time: null });
});

test("a march is chained when an earlier one moves any of its units, in date order", () => {
  const units = [unit("a", 0, 0)];
  const early = pathFor("early", east, units, {
    start: D,
    end: D + 2,
    turn: 0,
  });
  const late = pathFor("late", south, units, {
    start: D + 5,
    end: D + 6,
    turn: 0,
  });

  expect(Array.from(chainedPathIds([late, early]))).toEqual(["late"]);

  // Re-dating swaps which one follows the other
  const swapped = { ...early, march: { start: D + 9, end: D + 10, turn: 0 } };
  expect(Array.from(chainedPathIds([late, swapped]))).toEqual(["early"]);

  // Marches that start together chain in list order
  const together = { ...late, march: { start: D, end: D + 1, turn: 0 } };
  expect(Array.from(chainedPathIds([early, together]))).toEqual(["late"]);
});

test("a march can't begin before the story starts: moving shifts it, dragging its start stops", () => {
  const timing = { start: D - 2, end: D + 3, turn: 1 };

  expect(keepAfter(timing, D, true)).toEqual({ start: D, end: D + 5, turn: 1 });
  expect(keepAfter(timing, D, false)).toEqual({
    start: D,
    end: D + 3,
    turn: 1,
  });
  expect(keepAfter({ start: D + 1, end: D + 2, turn: 0 }, D, true).start).toBe(
    D + 1
  );
});

test("a unit exists from when it appears until it leaves", () => {
  expect(existsAt({}, D)).toBe(true);
  expect(existsAt({ appears: D }, D - 1)).toBe(false);
  expect(existsAt({ appears: D }, D)).toBe(true);
  expect(existsAt({ appears: D, leaves: D + 2 }, D + 1)).toBe(true);
  expect(existsAt({ appears: D, leaves: D + 2 }, D + 2)).toBe(false);
});

test("the bar fits the whole story, and zooms about the pointer within limits", () => {
  const fit = fitView(D, D + 100);
  expect(fit.from).toBeLessThan(D);
  expect(fit.to).toBeGreaterThan(D + 100);
  expect(fitView(D, null).to).toBeGreaterThan(D + 7); // at least a week

  // Zooming in about day 50 keeps day 50 where it was on screen
  const view = { from: D, to: D + 100 };
  const zoomed = zoomView(view, D + 50, 0.5);
  expect(zoomed.from).toBeCloseTo(D + 25, 6);
  expect(zoomed.to).toBeCloseTo(D + 75, 6);
  const anchorShare = (D + 30 - view.from) / 100;
  const z2 = zoomView(view, D + 30, 0.1);
  expect((D + 30 - z2.from) / (z2.to - z2.from)).toBeCloseTo(anchorShare, 6);

  expect(zoomView(view, D, 1e-9).to - zoomView(view, D, 1e-9).from).toBeCloseTo(
    MIN_VIEW_DAYS,
    9
  );
  expect(zoomView(view, D, 1e9).to - zoomView(view, D, 1e9).from).toBeCloseTo(
    MAX_VIEW_DAYS,
    3
  );
});

test("dragged dates snap to round steps a few pixels wide", () => {
  expect(snapStepFor(MINUTE / 10)).toBe(MINUTE);
  expect(snapStepFor(HOUR / 100)).toBe(5 * MINUTE);
  expect(snapStepFor(HOUR / 20)).toBe(HOUR);
  expect(snapStepFor(1 / 20)).toBe(1);
  expect(snapStepFor(1)).toBe(7);
  expect(snapStepFor(100)).toBe(30);
});
