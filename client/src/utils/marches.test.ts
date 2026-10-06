import { Unit } from "../types";
import { attachUnits } from "./formation";
import {
  MIN_SPAN_DAYS,
  clampMarch,
  defaultTurn,
  dragMarch,
  marchPhase,
  snapTime,
} from "./marches";
import { createPlayback } from "./pathPlayback";

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

const timing = { start: 0, end: 10, turn: 2 };

test("a march turns first, then travels, and is finished after its end", () => {
  expect(marchPhase(timing, -1)).toEqual({ turn: 0, travel: 0 });
  expect(marchPhase(timing, 1)).toEqual({ turn: 0.5, travel: 0 });
  expect(marchPhase(timing, 2)).toEqual({ turn: 1, travel: 0 });
  expect(marchPhase(timing, 6)).toEqual({ turn: 1, travel: 0.5 });
  expect(marchPhase(timing, 10)).toEqual({ turn: 1, travel: 1 });
  expect(marchPhase(timing, 20)).toEqual({ turn: 1, travel: 1 });
});

test("a march with no turn starts travelling straight away", () => {
  const noTurn = { start: 0, end: 10, turn: 0 };
  expect(marchPhase(noTurn, 0)).toEqual({ turn: 1, travel: 0 });
  expect(marchPhase(noTurn, 5)).toEqual({ turn: 1, travel: 0.5 });
});

test("by default the turn gets the same share of the march as in the playback", () => {
  const units = [unit("a", 0, 0)]; // faces north, so it turns 90° to head east
  const attachment = attachUnits(
    {
      id: "p",
      name: "p",
      points: [
        { x: 0, y: 0 },
        { x: 1000, y: 0 },
      ],
      assignments: [],
    },
    units
  )!;
  const playback = createPlayback({ id: "p", name: "p", ...attachment }, units);

  // 150 of turning in a run of 1150, over a march of 11.5 days
  expect(defaultTurn(playback, 0, 11.5)).toBeCloseTo(1.5, 6);
});

test("dragging a march's bar moves it, or moves an end, keeping the turn's length", () => {
  expect(dragMarch(timing, 2.5, "move", 0)).toEqual({
    start: 2.5,
    end: 12.5,
    turn: 2,
  });
  expect(dragMarch(timing, 0.3, "move", 0.25)).toEqual({
    start: 0.25,
    end: 10.25,
    turn: 2,
  });

  expect(dragMarch(timing, -3, "start", 0)).toEqual({
    start: -3,
    end: 10,
    turn: 2,
  });
  expect(dragMarch(timing, 20, "start", 0).start).toBeCloseTo(
    8 - MIN_SPAN_DAYS,
    10
  );

  expect(dragMarch(timing, 4, "end", 0)).toEqual({
    start: 0,
    end: 14,
    turn: 2,
  });
  expect(dragMarch(timing, -20, "end", 0).end).toBeCloseTo(
    2 + MIN_SPAN_DAYS,
    10
  );
});

test("dragging the split changes how long the turn takes, within the march", () => {
  expect(dragMarch(timing, 3, "split", 0).turn).toBeCloseTo(5, 10);
  expect(dragMarch(timing, -5, "split", 0).turn).toBe(0);
  expect(dragMarch(timing, 20, "split", 0).turn).toBeCloseTo(
    10 - MIN_SPAN_DAYS,
    10
  );
  expect(dragMarch(timing, 0.9, "split", 1).turn).toBe(3); // snapped to a whole day
});

test("timings are kept sensible, and times snap to whole steps", () => {
  expect(clampMarch({ start: 5, end: 2, turn: 1 })).toEqual({
    start: 5,
    end: 5 + MIN_SPAN_DAYS,
    turn: 0,
  });
  expect(clampMarch({ start: 0, end: 10, turn: 15 }).turn).toBeCloseTo(
    10 - MIN_SPAN_DAYS,
    10
  );
  expect(clampMarch({ start: 0, end: 10, turn: -1 }).turn).toBe(0);

  expect(snapTime(1.26, 0.25)).toBe(1.25);
  expect(snapTime(1.26, 0)).toBe(1.26);
});
