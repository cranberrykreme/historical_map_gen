import { MapPath, PathPoint } from "../types";
import { attachUnits, changeFormationMode, reanchorPaths } from "./formation";
import { applyOffset, headingAtDistance, samplePath } from "./pathGeometry";

const RAD = Math.PI / 180;

const path = (
  points: PathPoint[],
  assignments: MapPath["assignments"] = [],
  direction?: number
): MapPath => ({ id: "p", name: "Path 1", points, assignments, direction });

// The frame a path's slots are measured against: its direction if it has one (the formation
// turns with its units), otherwise its start heading (the formation stays as placed)
const frameOf = (p: { points: PathPoint[]; direction?: number }) =>
  p.direction !== undefined
    ? p.direction * RAD
    : headingAtDistance(samplePath(p.points), 0);

const east = [
  { x: 0, y: 0 },
  { x: 200, y: 0 },
];

test("the first attachment moves the path start to the formation centre", () => {
  const result = attachUnits(path(east), [
    { id: "a", x: 50, y: 20 },
    { id: "b", x: 50, y: -20 },
  ])!;

  expect(result.points[0].x).toBeCloseTo(50, 6);
  expect(result.points[0].y).toBeCloseTo(0, 6);
  expect(result.points[1]).toEqual({ x: 200, y: 0 });
  expect(result.direction).toBeUndefined();
});

test("by default the formation is recorded against the path's own heading, as placed", () => {
  // Two units in a line across an east-bound path
  const result = attachUnits(
    path([
      { x: 0, y: 50 },
      { x: 200, y: 50 },
    ]),
    [
      { id: "a", x: 50, y: 30 },
      { id: "b", x: 50, y: 70 },
    ]
  )!;

  const [a, b] = result.assignments;
  expect(a.forward).toBeCloseTo(0, 6);
  expect(b.forward).toBeCloseTo(0, 6);
  expect(a.right).toBeCloseTo(-20, 6);
  expect(b.right).toBeCloseTo(20, 6);
});

test("when the group turns with its units, the formation is recorded against the way they face", () => {
  // Two units side by side facing north, with the route leaving to the north-west
  const result = attachUnits(
    path(
      [
        { x: 0, y: 0 },
        { x: -200, y: -200 },
      ],
      [],
      0
    ),
    [
      { id: "a", x: 30, y: 50 },
      { id: "b", x: 70, y: 50 },
    ]
  )!;

  expect(result.direction).toBeCloseTo(-90, 6);
  const [a, b] = result.assignments;
  expect(a.forward).toBeCloseTo(0, 6);
  expect(b.forward).toBeCloseTo(0, 6);
  expect(a.right).toBeCloseTo(-20, 6);
  expect(b.right).toBeCloseTo(20, 6);
});

test("the group direction is the average of the way its units are facing", () => {
  const result = attachUnits(path(east, [], 0), [
    { id: "a", x: 50, y: 0, rotation: 0 }, // faces north
    { id: "b", x: 60, y: 0, rotation: 90 }, // faces east
  ])!;

  expect(result.direction).toBeCloseTo(-45, 6);
});

test("a mirrored unit faces the other way", () => {
  const result = attachUnits(path(east, [], 0), [
    { id: "a", x: 50, y: 0, forwardAngle: 0, flipped: true },
  ])!;

  expect(Math.abs(result.direction!)).toBeCloseTo(180, 6);
});

test("with no unit turning to face travel, the direction falls back to the path's heading", () => {
  const result = attachUnits(path(east, [], 0), [
    { id: "ship", x: 50, y: 0, travelMode: "upright" },
  ])!;

  expect(result.direction).toBeCloseTo(0, 6);
});

test("portraits, which stay upright, do not count towards the group direction", () => {
  const result = attachUnits(path(east, [], 0), [
    { id: "army", x: 50, y: 0, rotation: 90 }, // faces east
    { id: "leader", x: 50, y: 30, assetType: "portraits" },
  ])!;

  expect(result.direction).toBeCloseTo(0, 6);
});

test("every slot reproduces the unit's own position at the start of the path, in either mode", () => {
  const units = [
    { id: "a", x: 120, y: 90, rotation: 30 },
    { id: "b", x: 150, y: 60 },
    { id: "c", x: 100, y: 40, rotation: -20 },
  ];
  const bent = [
    { x: 0, y: 0 },
    { x: 100, y: 60 },
    { x: 180, y: -20 },
  ];

  for (const startDirection of [undefined, 0]) {
    const result = attachUnits(path(bent, [], startDirection), units)!;
    result.assignments.forEach((slot, i) => {
      const position = applyOffset(result.points[0], slot, frameOf(result));
      expect(position.x).toBeCloseTo(units[i].x, 6);
      expect(position.y).toBeCloseTo(units[i].y, 6);
    });
  }
});

test("attaching more units keeps the start, the mode and the existing slots", () => {
  for (const startDirection of [undefined, 0]) {
    const first = attachUnits(path(east, [], startDirection), [
      { id: "a", x: 50, y: 20 },
      { id: "b", x: 50, y: -20 },
    ])!;
    const more = attachUnits(
      path(first.points, first.assignments, first.direction),
      [{ id: "c", x: 10, y: 10, rotation: 90 }]
    )!;

    expect(more.points[0]).toEqual(first.points[0]);
    expect(more.direction).toBe(first.direction);
    expect(more.assignments.map((a) => a.unitId).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(more.assignments.find((a) => a.unitId === "a")).toEqual(
      first.assignments.find((a) => a.unitId === "a")
    );
  }
});

test("re-attaching the whole group records a fresh formation and moves the start", () => {
  const first = attachUnits(path(east), [
    { id: "a", x: 50, y: 20 },
    { id: "b", x: 50, y: -20 },
  ])!;
  const again = attachUnits(
    path(first.points, first.assignments, first.direction),
    [
      { id: "a", x: 70, y: 20 },
      { id: "b", x: 70, y: -20 },
    ]
  )!;

  expect(again.points[0].x).toBeCloseTo(70, 6);
  expect(again.assignments).toHaveLength(2);
});

test("attaching no units does nothing", () => {
  expect(attachUnits(path(east), [])).toBeNull();
});

test("switching the formation mode re-measures the slots without moving anyone", () => {
  const units = [
    { id: "a", x: 50, y: 20 },
    { id: "b", x: 50, y: -20 },
  ];
  const attached = attachUnits(path(east), units)!;
  const keep = path(attached.points, attached.assignments, attached.direction);

  const wheel = changeFormationMode(keep, units, "wheel");
  expect(wheel.direction).toBeCloseTo(-90, 6);
  wheel.assignments.forEach((slot, i) => {
    const position = applyOffset(keep.points[0], slot, wheel.direction! * RAD);
    expect(position.x).toBeCloseTo(units[i].x, 6);
    expect(position.y).toBeCloseTo(units[i].y, 6);
  });

  const back = changeFormationMode(
    { ...keep, direction: wheel.direction, assignments: wheel.assignments },
    units,
    "keep"
  );
  expect(back.direction).toBeUndefined();
  back.assignments.forEach((slot, i) => {
    const position = applyOffset(keep.points[0], slot, frameOf(keep));
    expect(position.x).toBeCloseTo(units[i].x, 6);
    expect(position.y).toBeCloseTo(units[i].y, 6);
  });
});

// A path attached to two units, with its start at (50, 0)
const twoUnits = (direction?: number) => {
  const first = attachUnits(path(east, [], direction), [
    { id: "a", x: 50, y: 20 },
    { id: "b", x: 50, y: -20 },
  ])!;
  return path(first.points, first.assignments, first.direction);
};

const beforeMove = [
  { id: "a", x: 50, y: 20 },
  { id: "b", x: 50, y: -20 },
];

test("moving every attached unit together carries the path start with them", () => {
  const afterMove = [
    { id: "a", x: 80, y: 50 },
    { id: "b", x: 80, y: 10 },
  ];
  const moved = reanchorPaths([twoUnits()], beforeMove, afterMove)[0];

  expect(moved.points[0].x).toBeCloseTo(80, 6);
  expect(moved.points[0].y).toBeCloseTo(30, 6);
  expect(moved.points[1]).toEqual({ x: 200, y: 0 });

  // Every slot still reproduces its unit's position, so nothing jumps when playback starts
  moved.assignments.forEach((slot, i) => {
    const position = applyOffset(moved.points[0], slot, frameOf(moved));
    expect(position.x).toBeCloseTo(afterMove[i].x, 6);
    expect(position.y).toBeCloseTo(afterMove[i].y, 6);
  });
});

test("moving one attached unit keeps the start and re-records that unit's slot", () => {
  const original = twoUnits();
  const moved = reanchorPaths([original], beforeMove, [
    { id: "a", x: 60, y: 40 },
    { id: "b", x: 50, y: -20 },
  ])[0];

  expect(moved.points).toEqual(original.points);
  expect(moved.direction).toBeUndefined();

  // The path heads east, so a point 10 east and 40 south of the start is 10 ahead, 40 to the right
  const a = moved.assignments.find((slot) => slot.unitId === "a")!;
  expect(a.forward).toBeCloseTo(10, 6);
  expect(a.right).toBeCloseTo(40, 6);

  const b = moved.assignments.find((slot) => slot.unitId === "b")!;
  const oldB = original.assignments.find((slot) => slot.unitId === "b")!;
  expect(b.forward).toBeCloseTo(oldB.forward, 6);
  expect(b.right).toBeCloseTo(oldB.right, 6);
});

test("a path that turns with its units keeps its direction when a unit is moved", () => {
  const original = twoUnits(0);
  expect(original.direction).toBeCloseTo(-90, 6);

  const moved = reanchorPaths([original], beforeMove, [
    { id: "a", x: 60, y: 40 },
    { id: "b", x: 50, y: -20 },
  ])[0];

  expect(moved.direction).toBeCloseTo(-90, 6);
  // The group faces north, so a point 40 south of the start is 40 behind it, 10 to its right
  const a = moved.assignments.find((slot) => slot.unitId === "a")!;
  expect(a.forward).toBeCloseTo(-40, 6);
  expect(a.right).toBeCloseTo(10, 6);
});

test("a path whose attached units did not move is left untouched", () => {
  const original = twoUnits();
  const result = reanchorPaths(
    [original],
    [...beforeMove, { id: "z", x: 0, y: 0 }],
    [...beforeMove, { id: "z", x: 99, y: 99 }]
  );
  expect(result[0]).toBe(original);
});

test("a path with no attached units is left untouched", () => {
  const bare = path([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ]);
  expect(
    reanchorPaths(
      [bare],
      [{ id: "a", x: 0, y: 0 }],
      [{ id: "a", x: 5, y: 5 }]
    )[0]
  ).toBe(bare);
});
