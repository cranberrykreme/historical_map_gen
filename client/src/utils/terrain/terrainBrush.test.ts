import { PathPoint, TerrainFeature } from "../../types";
import { areaCentre, centroid, inPolygon, sampleCurve } from "./terrain";
import {
  applyTerrainEdit,
  eraseTerrain,
  isEmptyEdit,
  paintArea,
  paintLine,
  simplifyRing,
  simplifyRun,
} from "./terrainBrush";

const square = (
  x0: number,
  y0: number,
  x1: number,
  y1: number
): PathPoint[] => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];
const feature = (
  id: string,
  kind: TerrainFeature["kind"],
  points: PathPoint[]
): TerrainFeature => ({
  id,
  kind,
  points,
});
// Whether a point is inside a feature as drawn: inside its smooth edge, and not in a hole
const inside = (f: TerrainFeature, p: PathPoint) =>
  inPolygon(p, sampleCurve(f.points, true, 4)) &&
  !(f.holes ?? []).some((h) => inPolygon(p, sampleCurve(h, true, 4)));

test("simplifying keeps the ends and the corners, and drops points along straight stretches", () => {
  const run = [0, 1, 2, 3, 4, 5]
    .map((x) => ({ x: x * 10, y: 0 }))
    .concat([{ x: 50, y: 50 }]);
  expect(simplifyRun(run, 1)).toEqual([
    { x: 0, y: 0 },
    { x: 50, y: 0 },
    { x: 50, y: 50 },
  ]);
  const ring = sampleCurve(square(0, 0, 100, 100), true, 2);
  const simple = simplifyRing(ring, 3);
  expect(simple.length).toBeLessThan(ring.length / 4);
  expect(simple.length).toBeGreaterThanOrEqual(4);
});

test("painting on open ground makes a new area along the stroke", () => {
  const edit = paintArea(
    [],
    "forest",
    [
      { x: 100, y: 100 },
      { x: 300, y: 100 },
    ],
    30
  );
  expect(edit.add).toHaveLength(1);
  const made = edit.add[0];
  expect(made.kind).toBe("forest");
  expect(inside(made, { x: 200, y: 100 })).toBe(true);
  expect(inside(made, { x: 200, y: 125 })).toBe(true);
  expect(inside(made, { x: 200, y: 140 })).toBe(false);
  // round ends
  expect(inside(made, { x: 75, y: 100 })).toBe(true);
  expect(inside(made, { x: 65, y: 100 })).toBe(false);
  // a handful of points, not hundreds
  expect(made.points.length).toBeLessThan(40);
});

test("painting a kind onto an area of it grows that area, joining any others it touches", () => {
  const a = feature("a", "forest", square(0, 0, 100, 100));
  const b = feature("b", "forest", square(300, 0, 400, 100));
  const hill = feature("h", "hill", square(150, 0, 250, 100));
  const edit = paintArea(
    [a, b, hill],
    "forest",
    [
      { x: 80, y: 50 },
      { x: 320, y: 50 },
    ],
    20
  );
  // the first keeps its name and place, the other is joined into it
  expect(edit.update.map((f) => f.id)).toEqual(["a"]);
  expect(edit.remove).toEqual(["b"]);
  expect(edit.add).toEqual([]);
  const grown = edit.update[0];
  expect(inside(grown, { x: 50, y: 50 })).toBe(true);
  expect(inside(grown, { x: 200, y: 50 })).toBe(true);
  expect(inside(grown, { x: 350, y: 50 })).toBe(true);
  // the hill isn't touched
  expect(applyTerrainEdit([a, b, hill], edit).map((f) => f.id)).toEqual([
    "a",
    "h",
  ]);
});

test("a freehand line is smoothed into a few points; a tiny flick makes nothing", () => {
  const wobbly = Array.from({ length: 100 }, (_, i) => ({
    x: i * 5,
    y: Math.sin(i) * 0.8,
  }));
  const edit = paintLine("river", wobbly);
  expect(edit.add).toHaveLength(1);
  expect(edit.add[0].kind).toBe("river");
  expect(edit.add[0].points.length).toBeLessThan(6);
  expect(
    isEmptyEdit(
      paintLine("road", [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
      ])
    )
  ).toBe(true);
  // areas can't be painted as lines, nor lines as areas
  expect(isEmptyEdit(paintLine("forest", wobbly))).toBe(true);
  expect(isEmptyEdit(paintArea([], "river", wobbly, 20))).toBe(true);
});

test("erasing the middle of an area leaves a hole", () => {
  const forest = feature("f", "forest", square(0, 0, 400, 400));
  const edit = eraseTerrain([forest], [{ x: 200, y: 200 }], 50, "forest");
  expect(edit.update).toHaveLength(1);
  const cleared = edit.update[0];
  expect(cleared.holes).toHaveLength(1);
  expect(inside(cleared, { x: 200, y: 200 })).toBe(false);
  expect(inside(cleared, { x: 100, y: 100 })).toBe(true);
});

test("erasing right across an area splits it in two", () => {
  const forest = feature("f", "forest", square(0, 0, 400, 100));
  const edit = eraseTerrain(
    [forest],
    [
      { x: 200, y: -50 },
      { x: 200, y: 150 },
    ],
    30,
    null
  );
  expect(edit.update.map((f) => f.id)).toEqual(["f"]);
  expect(edit.add).toHaveLength(1);
  expect(edit.add[0].kind).toBe("forest");
  const [left, right] = [edit.update[0], edit.add[0]].sort(
    (p, q) => p.points[0].x - q.points[0].x
  );
  expect(
    inside(left, { x: 100, y: 50 }) || inside(right, { x: 100, y: 50 })
  ).toBe(true);
  expect(
    inside(left, { x: 200, y: 50 }) || inside(right, { x: 200, y: 50 })
  ).toBe(false);
});

test("erasing all of an area takes it away; crumbs aren't left behind", () => {
  const small = feature("s", "rocks", square(0, 0, 40, 40));
  const edit = eraseTerrain([small], [{ x: 20, y: 20 }], 40, null);
  expect(edit.remove).toEqual(["s"]);
});

test("the eraser only rubs out its own kind, unless set to every kind", () => {
  const forest = feature("f", "forest", square(0, 0, 400, 400));
  const hill = feature("h", "hill", square(0, 0, 400, 400));
  const onlyForest = eraseTerrain(
    [hill, forest],
    [{ x: 200, y: 200 }],
    50,
    "forest"
  );
  expect(onlyForest.update.map((f) => f.id)).toEqual(["f"]);
  const everything = eraseTerrain(
    [hill, forest],
    [{ x: 200, y: 200 }],
    50,
    null
  );
  expect(everything.update.map((f) => f.id).sort()).toEqual(["f", "h"]);
});

test("erasing across a line cuts it in two; erasing its end shortens it", () => {
  const road = feature("r", "road", [
    { x: 0, y: 100 },
    { x: 400, y: 100 },
  ]);
  const cut = eraseTerrain(
    [road],
    [
      { x: 200, y: 50 },
      { x: 200, y: 150 },
    ],
    20,
    null
  );
  expect(cut.update[0].id).toBe("r");
  expect(cut.add).toHaveLength(1);
  const xs = [...cut.update[0].points, ...cut.add[0].points].map((p) => p.x);
  expect(xs.every((x) => Math.abs(x - 200) >= 18)).toBe(true);
  const end = eraseTerrain([road], [{ x: 400, y: 100 }], 50, null);
  expect(end.add).toEqual([]);
  expect(Math.max(...end.update[0].points.map((p) => p.x))).toBeLessThan(355);
  // the eraser nowhere near leaves it alone
  expect(
    isEmptyEdit(eraseTerrain([road], [{ x: 200, y: 400 }], 20, null))
  ).toBe(true);
});

test("an edit keeps the features' order: replaced in place, removed gone, new on top", () => {
  const list = ["a", "b", "c"].map((id) =>
    feature(id, "forest", square(0, 0, 10, 10))
  );
  const next = applyTerrainEdit(list, {
    remove: ["b"],
    update: [{ ...list[2], name: "C" }],
    add: [feature("d", "forest", square(0, 0, 10, 10))],
  });
  expect(next.map((f) => f.id)).toEqual(["a", "c", "d"]);
  expect(next[1].name).toBe("C");
});

test("a shape's middle doesn't move however unevenly its points are spaced", () => {
  // a square with many points crowded along its top edge
  const crowded = [
    ...Array.from({ length: 20 }, (_, i) => ({ x: i * 5, y: 0 })),
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  expect(centroid(crowded).y).toBeLessThan(25);
  const middle = areaCentre(crowded);
  expect(middle.x).toBeCloseTo(50);
  expect(middle.y).toBeCloseTo(50);
});
