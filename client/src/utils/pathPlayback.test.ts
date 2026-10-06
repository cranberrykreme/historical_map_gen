import { MapPath, PathPoint, Unit } from "../types";
import { attachUnits } from "./formation";
import { facingRotation, headingAtDistance, samplePath } from "./pathGeometry";
import {
  artFacesRight,
  createPlayback,
  PIVOT_DEGREES_PER_UNIT,
  playbackLength,
  playbackState,
  PlaybackState,
  easeTravel,
} from "./pathPlayback";
import { normalizeDegrees } from "./unitFacing";

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

// A path with the given units attached, so its start sits at the units' centre.
// By default the formation is kept as placed; `wheel` makes the group turn with its units.
function pathFor(points: PathPoint[], units: Unit[], wheel = false): MapPath {
  const attachment = attachUnits(
    {
      id: "p",
      name: "Path 1",
      points,
      assignments: [],
      direction: wheel ? 0 : undefined,
    },
    units
  )!;
  return { id: "p", name: "Path 1", ...attachment };
}

const pair = () => [unit("a", 50, 20), unit("b", 50, -20)];
const east = [
  { x: 0, y: 0 },
  { x: 200, y: 0 },
];

// Two units side by side (40 apart), facing north, centred on (50, 100)
const row = () => [unit("a", 30, 100), unit("b", 70, 100)];

// The angle of the line from unit a to unit b: 0 when they stand side by side facing north,
// 90 once the block has turned to face east
const blockAngle = (state: Map<string, PlaybackState>) =>
  (Math.atan2(
    state.get("b")!.y - state.get("a")!.y,
    state.get("b")!.x - state.get("a")!.x
  ) *
    180) /
  Math.PI;

test("at the start of the path every unit is exactly where it was placed", () => {
  const units = pair();
  const state = playbackState(pathFor(east, units), units, 0);

  expect(state.get("a")!.x).toBeCloseTo(50, 6);
  expect(state.get("a")!.y).toBeCloseTo(20, 6);
  expect(state.get("b")!.x).toBeCloseTo(50, 6);
  expect(state.get("b")!.y).toBeCloseTo(-20, 6);
});

test("a group heading the way it faces moves as a rigid block", () => {
  const units = row();
  // The route runs due north from the formation centre
  const path = pathFor(
    [
      { x: 0, y: 100 },
      { x: 50, y: -300 },
    ],
    units
  );
  const state = playbackState(path, units, 0.5);

  expect(state.get("a")!.x).toBeCloseTo(30, 5);
  expect(state.get("a")!.y).toBeCloseTo(-100, 5);
  expect(state.get("b")!.x).toBeCloseTo(70, 5);
  expect(state.get("b")!.y).toBeCloseTo(-100, 5);
});

test("units turn on the spot to face the path, then set off with the formation unchanged", () => {
  const units = row();
  const path = pathFor(
    [
      { x: 0, y: 100 },
      { x: 1000, y: 100 },
    ],
    units
  );
  const total = playbackLength(path, units);
  const at = (elapsed: number) => playbackState(path, units, elapsed / total);

  // 150 to turn (90° at 0.6° per unit), then 950 along the route
  expect(total).toBeCloseTo(90 / PIVOT_DEGREES_PER_UNIT + 950, 3);

  // While turning, nobody moves and each unit turns on the spot
  for (const elapsed of [0, 40, 75, 140]) {
    const state = at(elapsed);
    expect(state.get("a")!.x).toBeCloseTo(30, 5);
    expect(state.get("a")!.y).toBeCloseTo(100, 5);
    expect(state.get("b")!.x).toBeCloseTo(70, 5);
    expect(state.get("a")!.rotation).toBeCloseTo(
      elapsed * PIVOT_DEGREES_PER_UNIT,
      4
    );
    expect(state.get("b")!.rotation).toBeCloseTo(
      elapsed * PIVOT_DEGREES_PER_UNIT,
      4
    );
  }

  // Facing the path, they set off (gently at first) with the formation exactly as placed
  const travelled = 950 * easeTravel(10 / 950);
  const moving = at(160);
  expect(moving.get("a")!.x).toBeCloseTo(30 + travelled, 2);
  expect(moving.get("b")!.x).toBeCloseTo(70 + travelled, 2);
  expect(moving.get("a")!.y).toBeCloseTo(100, 5);
  expect(moving.get("a")!.rotation).toBeCloseTo(90, 3);

  const end = at(total);
  expect(end.get("a")!.x).toBeCloseTo(980, 3);
  expect(end.get("b")!.x).toBeCloseTo(1020, 3);
});

test("units placed in a line across the path stay in that line while they turn and travel", () => {
  // A north-south line of two units, facing north, with an east-bound route
  const units = [unit("a", 50, 80), unit("b", 50, 120)];
  const path = pathFor(
    [
      { x: 0, y: 100 },
      { x: 1000, y: 100 },
    ],
    units
  );

  for (const progress of [0, 0.05, 0.1, 0.5, 1]) {
    const state = playbackState(path, units, progress);
    expect(state.get("a")!.x).toBeCloseTo(state.get("b")!.x, 5); // side by side across the route
    expect(state.get("b")!.y - state.get("a")!.y).toBeCloseTo(40, 5);
  }
});

test("a group that turns with its units pivots as a block, then sets off", () => {
  const units = row();
  const path = pathFor(
    [
      { x: 0, y: 100 },
      { x: 1000, y: 100 },
    ],
    units,
    true
  );
  const total = playbackLength(path, units);
  const at = (elapsed: number) => playbackState(path, units, elapsed / total);

  expect(total).toBeCloseTo(90 / PIVOT_DEGREES_PER_UNIT + 950, 3);

  // While pivoting, the centre never moves and the units turn with the block
  for (const elapsed of [0, 40, 75, 140]) {
    const state = at(elapsed);
    const a = state.get("a")!;
    const b = state.get("b")!;
    expect((a.x + b.x) / 2).toBeCloseTo(50, 5);
    expect((a.y + b.y) / 2).toBeCloseTo(100, 5);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(40, 5);
    expect(a.rotation).toBeCloseTo(elapsed * PIVOT_DEGREES_PER_UNIT, 4);
  }
  expect(blockAngle(at(0))).toBeCloseTo(0, 4); // side by side, facing north
  expect(blockAngle(at(75))).toBeCloseTo(45, 3); // halfway through the pivot

  // Now facing the path, it sets off with the block facing east
  const moving = at(160);
  expect(blockAngle(moving)).toBeCloseTo(90, 3);
  expect((moving.get("a")!.x + moving.get("b")!.x) / 2).toBeCloseTo(
    50 + 950 * easeTravel(10 / 950),
    2
  );

  const end = at(total);
  expect(end.get("a")!.x).toBeCloseTo(1000, 3);
  expect(end.get("a")!.y).toBeCloseTo(80, 3);
  expect(end.get("b")!.y).toBeCloseTo(120, 3);
});

test("a turning group pivots about its centre, and units that don't turn keep their rotation", () => {
  const units = [
    unit("army", 50, 20),
    unit("ship", 50, -20, { travelMode: "upright", forwardAngle: 0 }),
  ];
  const path = pathFor(east, units, true);
  const total = playbackLength(path, units);
  const state = playbackState(path, units, 75 / total);
  const army = state.get("army")!;
  const ship = state.get("ship")!;

  // Halfway through a 90° pivot the block has turned 45° about the centre, (50, 0)
  expect(ship.x).toBeCloseTo(50 + 20 * Math.SQRT1_2, 4);
  expect(ship.y).toBeCloseTo(-20 * Math.SQRT1_2, 4);
  expect(army.x).toBeCloseTo(50 - 20 * Math.SQRT1_2, 4);
  expect(army.y).toBeCloseTo(20 * Math.SQRT1_2, 4);
  expect(army.rotation).toBeCloseTo(45, 4);
  expect(ship.rotation).toBe(0);
});

test("a very fast pivot rate swings a turning group straight round", () => {
  const units = row();
  const path = pathFor(
    [
      { x: 0, y: 100 },
      { x: 1000, y: 100 },
    ],
    units,
    true
  );

  expect(blockAngle(playbackState(path, units, 0.1, 1000))).toBeCloseTo(90, 3);
});

test("units already facing the way the path leaves do not pivot", () => {
  const facingEast = [unit("a", 0, 50, { rotation: 90 })];
  const path = pathFor(
    [
      { x: 0, y: 50 },
      { x: 1000, y: 50 },
    ],
    facingEast
  );

  expect(playbackLength(path, facingEast)).toBeCloseTo(
    samplePath(path.points).length,
    4
  );
  expect(playbackState(path, facingEast, 0).get("a")!.rotation).toBeCloseTo(
    90,
    4
  );
  expect(playbackState(path, facingEast, 0.5).get("a")!.rotation).toBeCloseTo(
    90,
    4
  );
});

test("units facing another way pivot to face the path before moving", () => {
  const solo = [unit("a", 0, 50)]; // faces north

  const eastPath = pathFor(
    [
      { x: 0, y: 50 },
      { x: 1000, y: 50 },
    ],
    solo
  );
  const eastTotal = playbackLength(eastPath, solo);
  const eastPivot = eastTotal - samplePath(eastPath.points).length;
  expect(eastPivot).toBeCloseTo(90 / PIVOT_DEGREES_PER_UNIT, 3);

  // Halfway through the pivot it has turned 45° and has not moved
  const half = playbackState(eastPath, solo, eastPivot / 2 / eastTotal).get(
    "a"
  )!;
  expect(half.rotation).toBeCloseTo(45, 3);
  expect(half.x).toBeCloseTo(0, 5);
  expect(half.y).toBeCloseTo(50, 5);

  // Heading south from facing north is a half turn
  const southPath = pathFor(
    [
      { x: 0, y: 50 },
      { x: 0, y: 1000 },
    ],
    solo
  );
  const southPivot =
    playbackLength(southPath, solo) - samplePath(southPath.points).length;
  expect(southPivot).toBeCloseTo(180 / PIVOT_DEGREES_PER_UNIT, 3);
  expect(
    Math.abs(
      normalizeDegrees(playbackState(southPath, solo, 1).get("a")!.rotation)
    )
  ).toBeCloseTo(180, 3);
});

test("after the pivot, turning units face the path's heading exactly, round bends too", () => {
  const solo = [unit("a", 50, 0)];
  const path = pathFor(
    [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ],
    solo
  );
  const sampled = samplePath(path.points);
  const total = playbackLength(path, solo);
  const pivotLength = total - sampled.length;

  // `t` is how far into the travelling we are. The march speeds up and slows down, so the
  // distance it has covered by then is eased.
  for (const t of [0, 30, 60, 100, sampled.length]) {
    const state = playbackState(path, solo, (pivotLength + t) / total).get(
      "a"
    )!;
    const travelled = sampled.length * easeTravel(t / sampled.length);
    const expected = facingRotation(
      headingAtDistance(sampled, travelled),
      -90,
      false
    );
    expect(normalizeDegrees(state.rotation - expected)).toBeCloseTo(0, 4);
  }
});

test("units in Upright mode keep their rotation and mirror to face left or right", () => {
  const ship = (extra: Partial<Unit> = {}) =>
    unit("s", 150, 0, { travelMode: "upright", forwardAngle: 0, ...extra });

  const eastBound = [ship()];
  const eastState = playbackState(
    pathFor(
      [
        { x: 0, y: 0 },
        { x: 300, y: 0 },
      ],
      eastBound
    ),
    eastBound,
    0.5
  ).get("s")!;
  expect(eastState.flipped).toBe(false);
  expect(eastState.rotation).toBe(0);

  const westBound = [ship()];
  const westState = playbackState(
    pathFor(
      [
        { x: 300, y: 0 },
        { x: 0, y: 0 },
      ],
      westBound
    ),
    westBound,
    0.5
  ).get("s")!;
  expect(westState.flipped).toBe(true);
  expect(westState.rotation).toBe(0);

  // Art drawn facing left needs mirroring to travel east
  const leftFacing = [ship({ forwardAngle: 180 })];
  const leftState = playbackState(
    pathFor(
      [
        { x: 0, y: 0 },
        { x: 300, y: 0 },
      ],
      leftFacing
    ),
    leftFacing,
    0.5
  ).get("s")!;
  expect(leftState.flipped).toBe(true);
});

test("units in Fixed mode never turn or mirror", () => {
  const fixed = [
    unit("f", 0, 50, { travelMode: "fixed", rotation: 30, flipped: true }),
  ];
  const state = playbackState(
    pathFor(
      [
        { x: 0, y: 0 },
        { x: 0, y: 200 },
      ],
      fixed
    ),
    fixed,
    0.5
  ).get("f")!;

  expect(state.rotation).toBe(30);
  expect(state.flipped).toBe(true);
});

test("progress outside 0 to 1 is clamped to the ends of the run", () => {
  const units = pair();
  const path = pathFor(east, units);

  expect(playbackState(path, units, -3).get("a")).toEqual(
    playbackState(path, units, 0).get("a")
  );
  expect(playbackState(path, units, 7).get("a")).toEqual(
    playbackState(path, units, 1).get("a")
  );
});

test("units that no longer exist are skipped", () => {
  const units = pair();
  const path = pathFor(east, units);

  expect(Array.from(playbackState(path, [units[0]], 0.5).keys())).toEqual([
    "a",
  ]);
});

test("artFacesRight tells which side the unmirrored art faces", () => {
  expect(artFacesRight(0)).toBe(true);
  expect(artFacesRight(180)).toBe(false);
  expect(artFacesRight(-135)).toBe(false);
  expect(artFacesRight(-90)).toBe(true);
  expect(artFacesRight(90)).toBe(true);
});

test("a prepared playback gives the same answers as one-off calls", () => {
  const units = row();
  const path = pathFor(
    [
      { x: 0, y: 100 },
      { x: 1000, y: 100 },
    ],
    units
  );
  const playback = createPlayback(path, units);

  expect(playback.length).toBeCloseTo(playbackLength(path, units), 10);
  for (const progress of [0, 0.07, 0.5, 1]) {
    expect(playback.stateAt(progress)).toEqual(
      playbackState(path, units, progress)
    );
  }
});

test("a march speeds up over its first 10% and slows down over its last 10%", () => {
  expect(easeTravel(0)).toBe(0);
  expect(easeTravel(1)).toBe(1);
  expect(easeTravel(0.5)).toBeCloseTo(0.5, 10);

  // Slow at the start: after 5% of the time it has covered well under 5% of the way
  expect(easeTravel(0.05)).toBeLessThan(0.02);
  // The end mirrors the start
  for (const u of [0.02, 0.07, 0.3]) {
    expect(easeTravel(u) + easeTravel(1 - u)).toBeCloseTo(1, 10);
  }
  // Steady in the middle, a little quicker than average to make up for the gentle ends
  expect(easeTravel(0.6) - easeTravel(0.5)).toBeCloseTo(0.1 / 0.9, 10);
  // Never goes backwards
  let previous = 0;
  for (let u = 0; u <= 1.0001; u += 0.01) {
    const s = easeTravel(u);
    expect(s).toBeGreaterThanOrEqual(previous - 1e-12);
    previous = s;
  }
});

test("a march sets off gently, keeps a steady pace, and settles exactly at its end", () => {
  const solo = [unit("a", 0, 50, { rotation: 90 })]; // already facing east, so no turning
  const path = pathFor(
    [
      { x: 0, y: 50 },
      { x: 1000, y: 50 },
    ],
    solo
  );
  const x = (progress: number) =>
    playbackState(path, solo, progress).get("a")!.x;

  expect(x(0.01)).toBeLessThan(2); // barely moving yet
  expect(x(0.6) - x(0.5)).toBeCloseTo(x(0.5) - x(0.4), 6); // steady in the middle
  expect(x(0.99)).toBeGreaterThan(998); // almost stopped near the end
  expect(x(1)).toBeCloseTo(1000, 6);
});
