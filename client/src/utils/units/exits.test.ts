import { Shot, Unit } from "../../types";
import { createTimeline } from "../history/timeline";
import {
  backAngle,
  defaultExit,
  exitFrame,
  EXIT_STYLES,
  historyExitAge,
  leavingAt,
  markerAlpha,
  markersAt,
  tidyExit,
  videoExitAge,
} from "./exits";
import { blockUnit, newBlockSpec } from "./blocks";

const shot = (id: string, seconds: number, from: number, to: number): Shot => ({
  id,
  name: id,
  seconds,
  from,
  to,
});

const unit = (patch: Partial<Unit> = {}): Unit => ({
  id: "u1",
  filename: "Army_Red1.png",
  path: "Army_Red1.png",
  assetType: "units",
  x: 100,
  y: 200,
  rotation: 0,
  scale: 1,
  ...patch,
});

test("settings are kept in range and anything that isn't a style is dropped", () => {
  expect(tidyExit({ style: "fall", seconds: 99 })).toEqual({
    style: "fall",
    seconds: 6,
  });
  expect(tidyExit({ style: "nope" as never })).toBeUndefined();
  expect(tidyExit(null)).toBeUndefined();
  // how long a marker stays only counts with a marker
  expect(tidyExit({ style: "fade", markerFades: 5 })).toEqual({
    style: "fade",
  });
  expect(tidyExit({ style: "fade", marker: "cross", markerFades: 0 })).toEqual({
    style: "fade",
    marker: "cross",
    markerFades: 1,
  });
});

test("units that die without a style get the usual one for their kind", () => {
  expect(defaultExit(unit()).style).toBe("fade");
  expect(defaultExit(unit({ travelMode: "upright" })).style).toBe("sink");
  expect(defaultExit(unit({ assetType: "portraits" })).style).toBe("tear");
  expect(defaultExit(blockUnit(newBlockSpec(), 0, 0)).style).toBe("shatter");
});

test("the animation starts when the video reaches the moment, in seconds of video", () => {
  // 10 seconds of video showing days 100 to 110: day 105 is reached 5 seconds in
  const shots = [shot("a", 10, 100, 110)];
  expect(videoExitAge(shots, 4, 105)).toBeNull();
  expect(videoExitAge(shots, 6, 105)).toBeCloseTo(1, 5);
  // carried on by a shot that starts where this one ends, it keeps counting
  const twoShots = [shot("a", 10, 100, 110), shot("b", 10, 110, 200)];
  expect(videoExitAge(twoShots, 12, 109)).toBeCloseTo(3, 5);
  // a cut that jumps past the moment: it happened off screen
  const cut = [shot("a", 10, 100, 104), shot("b", 10, 150, 160)];
  expect(videoExitAge(cut, 11, 105)).toBe(Infinity);
  // a cut landing right on the moment plays it from the cut
  const onIt = [shot("a", 10, 100, 104), shot("b", 10, 105, 105)];
  expect(videoExitAge(onIt, 12, 105)).toBeCloseTo(2, 5);
  // in history mode it follows the playback pace (days a second)
  expect(historyExitAge(105.5, 105, 0.5)).toBeCloseTo(1, 5);
  expect(historyExitAge(104, 105, 1)).toBeNull();
});

test("a leaving unit stays where it left until its animation is done, then its marker shows", () => {
  const dying = unit({ leaves: 105, exit: { style: "fall", marker: "cross" } });
  const timeline = createTimeline([], [dying]);
  const at = (age: number) => leavingAt([dying], timeline, 106, () => age);
  expect(at(0.7)).toHaveLength(1);
  expect(at(0.7)[0].progress).toBeCloseTo(0.5, 5);
  expect(at(0.7)[0].unit).toMatchObject({ x: 100, y: 200 });
  expect(at(1.4)).toHaveLength(0);
  // still there before it leaves (it isn't leaving yet)
  expect(leavingAt([dying], timeline, 104, () => null)).toHaveLength(0);
  // the marker comes in over the second half, then stays
  expect(markersAt([dying], timeline, 106, () => 0.2)).toHaveLength(0);
  expect(markersAt([dying], timeline, 106, () => 100)[0]).toMatchObject({
    kind: "cross",
    x: 100,
    y: 200,
    alpha: 1,
  });
  // or fades once its time is up
  expect(
    markerAlpha({ style: "fade", marker: "patch", markerFades: 5 }, 1 + 5 + 0.5)
  ).toBeCloseTo(0.5, 5);
});

test("every style starts whole and ends gone", () => {
  for (const { style } of EXIT_STYLES) {
    const start = exitFrame(style, 0, "u1", 90, 1);
    expect(
      start.pieces.every((p) => p.alpha === 1 && p.x === 0 && p.y === 0)
    ).toBe(true);
    const end = exitFrame(style, 1, "u1", 90, 1);
    expect(end.pieces.every((p) => p.alpha <= 0.001)).toBe(true);
  }
});

test("the paper tear runs from both top corners into an X, then parts in four", () => {
  const ripping = exitFrame("tear", 0.25, "u1", 90, 1);
  expect(ripping.pieces).toHaveLength(4);
  expect(ripping.tears).toHaveLength(2);
  const [fromLeft, fromRight] = ripping.tears.map((t) => t.points);
  expect(fromLeft[0]).toEqual({ x: 0, y: 0 });
  expect(fromRight[0]).toEqual({ x: 1, y: 0 });
  // halfway through ripping, both tears have reached about the middle
  const tip = fromLeft[fromLeft.length - 1];
  expect(tip.x).toBeGreaterThan(0.35);
  expect(tip.x).toBeLessThan(0.65);
  // the same unit always tears the same way
  expect(exitFrame("tear", 0.25, "u1", 90, 1)).toEqual(ripping);
  // once it parts, the top piece goes up and the bottom one down
  const parting = exitFrame("tear", 0.75, "u1", 90, 1);
  expect(parting.pieces[0].y).toBeLessThan(parting.pieces[2].y);
});

test("shards fly outwards, ships ripple, and routed troops run the way they face away from", () => {
  const shatter = exitFrame("shatter", 0.5, "u1", 90, 1);
  expect(shatter.pieces).toHaveLength(18);
  for (const p of shatter.pieces) {
    const out = (p.origin.x - 0.5) * p.x + (p.origin.y - 0.5) * p.y;
    expect(out).toBeGreaterThanOrEqual(0);
  }
  expect(exitFrame("sink", 0.3, "u1", 90, 1).ripples.length).toBeGreaterThan(0);
  // a block faces up, so it runs down
  const block = blockUnit(newBlockSpec(), 0, 0);
  expect(backAngle(block)).toBe(90);
  expect(
    exitFrame("rout", 0.9, "u1", backAngle(block), 1).pieces[0].y
  ).toBeGreaterThan(0.3);
});
