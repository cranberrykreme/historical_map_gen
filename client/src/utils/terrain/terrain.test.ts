import { TerrainFeature } from "../../types";
import { terrainSvg } from "./terrainScene";
import {
  alongCurve,
  centroid,
  featureLabels,
  isLine,
  featureStrokes,
  inPolygon,
  insertionIndex,
  minPoints,
  parseTerrain,
  ringPoints,
  shrink,
  smoothPath,
  sampleCurve,
  scatterItems,
  sortedFeatures,
  TERRAIN_KINDS,
} from "./terrain";

const square = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];
const feature = (id: string, kind: TerrainFeature["kind"]): TerrainFeature => ({
  id,
  kind,
  points: isLine(kind) ? square.slice(0, 3) : square,
});

test("a smooth curve passes through every point; a closed one comes back to the start", () => {
  const open = smoothPath(square, false);
  expect(open.startsWith("M0 0")).toBe(true);
  expect((open.match(/C/g) ?? []).length).toBe(3);
  expect(open.endsWith("0 100")).toBe(true);
  const closed = smoothPath(square, true);
  expect((closed.match(/C/g) ?? []).length).toBe(4);
  expect(closed.endsWith("0 0Z")).toBe(true);
  expect(smoothPath(square.slice(0, 2), false)).toBe("M0 0L100 0");
  expect(smoothPath([], true)).toBe("");
});

test("a hill's higher rings are the shape shrunk towards its middle", () => {
  expect(centroid(square)).toEqual({ x: 50, y: 50 });
  expect(shrink(square, 0.5)[0]).toEqual({ x: 25, y: 25 });
  const strokes = featureStrokes(feature("h", "hill"));
  expect(strokes).toHaveLength(3);
});

test("each kind has its own look", () => {
  for (const { kind, shape } of TERRAIN_KINDS) {
    const strokes = featureStrokes(feature(kind, kind));
    expect(strokes.length).toBeGreaterThan(0);
    // every stroke has something to draw
    expect(strokes.every((s) => s.d.length > 0)).toBe(true);
    // lines always have a stroke along them; areas start with a filled shape
    if (shape === "line") expect(strokes.some((s) => s.stroke)).toBe(true);
    else expect(strokes[0].fill).toBeTruthy();
  }
  expect(minPoints("stream")).toBe(2);
  expect(minPoints("lake")).toBe(3);
});

test("features are drawn by kind, ground first and roads last, then in the order drawn", () => {
  const order = sortedFeatures([
    feature("road", "road"),
    feature("hill1", "hill"),
    feature("field", "field"),
    feature("hill2", "hill"),
    feature("forest", "forest"),
  ]).map((f) => f.id);
  expect(order).toEqual(["field", "hill1", "hill2", "forest", "road"]);
});

test("water goes under the ground, and walls over the roads", () => {
  const order = sortedFeatures([
    feature("wall", "wall"),
    feature("land", "land"),
    feature("road", "road"),
    feature("deep", "deep"),
  ]).map((f) => f.id);
  expect(order).toEqual(["deep", "land", "road", "wall"]);
});

test("ticks along a line are evenly spaced, with the line's direction", () => {
  const along = alongCurve(
    [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ],
    20
  );
  expect(along.map((p) => Math.round(p.x))).toEqual([10, 30, 50, 70, 90]);
  expect(along[0].dx).toBeCloseTo(1, 9);
  expect(along[0].dy).toBeCloseTo(0, 9);
});

test("a new point goes into the edge nearest where it's added", () => {
  expect(insertionIndex(square, { x: 50, y: -5 }, true)).toBe(1);
  expect(insertionIndex(square, { x: 105, y: 50 }, true)).toBe(2);
  // the closing edge, from the last point back to the first
  expect(insertionIndex(square, { x: -5, y: 90 }, true)).toBe(4);
  expect(insertionIndex(square, { x: -5, y: 90 }, false)).toBe(3);
});

test("the battleground as an SVG has the ground, the patterns and every feature", () => {
  const svg = terrainSvg({
    id: "b",
    name: "B",
    kind: "sea",
    width: 400,
    height: 300,
    terrain: [feature("f", "deep")],
  });
  expect(svg).toContain('width="400" height="300"');
  expect(svg).toContain('fill="#4a78a0"');
  expect(svg).toContain('id="tp-waves"');
  expect(svg).toContain("url(#tp-waves)");
});

// The middle and radius of every circle in a stroke's path data (see circlePath)
const circles = (d: string) => {
  const out: { x: number; y: number; r: number }[] = [];
  const pattern = /M(-?[\d.]+) (-?[\d.]+)a([\d.]+) /g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(d)) !== null)
    out.push({
      x: Number(m[1]) + Number(m[3]),
      y: Number(m[2]),
      r: Number(m[3]),
    });
  return out;
};
const big = [
  { x: 0, y: 0 },
  { x: 400, y: 0 },
  { x: 400, y: 300 },
  { x: 0, y: 300 },
];

test("trees are scattered whole, never cut by the forest's edge", () => {
  const trees = scatterItems({ id: "f", kind: "forest", points: big }).flatMap(
    (s) => circles(s.d)
  );
  expect(trees.length).toBeGreaterThan(100);
  // the forest's smooth edge, as drawn
  const edge = sampleCurve(big, true, 8);
  for (const t of trees)
    expect(
      ringPoints(t.x, t.y, t.r - 0.1).every((p) => inPolygon(p, edge))
    ).toBe(true);
});

test("scattered items are the same each time, but differ from place to place", () => {
  const draw = (dx: number) =>
    scatterItems({
      id: "f",
      kind: "forest",
      points: big.map((p) => ({ x: p.x + dx, y: p.y })),
    })
      .map((s) => s.d)
      .join("");
  expect(draw(0)).toBe(draw(0));
  // the same forest moved along is a different forest, not the same trees shifted
  const moved = circles(draw(1000)).map(
    (t) => `${Math.round(t.x - 1000)} ${Math.round(t.y)}`
  );
  const here = circles(draw(0)).map(
    (t) => `${Math.round(t.x)} ${Math.round(t.y)}`
  );
  expect(moved.filter((t) => here.includes(t)).length).toBeLessThan(
    here.length / 4
  );
});

test("items keep clear of whatever blocks them", () => {
  const trees = scatterItems(
    { id: "f", kind: "forest", points: big },
    { blocked: (x, y, r) => Math.abs(y - 150) < 20 + r }
  ).flatMap((s) => circles(s.d));
  expect(trees.every((t) => Math.abs(t.y - 150) >= 20 + t.r)).toBe(true);
});

test("every kind with items has some, and a mountain under snow has bigger snow caps", () => {
  for (const kind of [
    "forest",
    "pines",
    "orchard",
    "scrub",
    "rocks",
    "mountain",
    "marsh",
    "town",
    "walled",
  ] as const)
    expect(
      scatterItems({ id: kind, kind, points: big }).length
    ).toBeGreaterThan(0);
  // how far down each peak its snow reaches, peak by peak
  const capDepths = (snowy: boolean) => {
    const d = scatterItems(
      { id: "m", kind: "mountain", points: big },
      { snowy: () => snowy }
    ).find((s) => s.fill === "#f3f1ea")!.d;
    return d
      .split("M")
      .filter(Boolean)
      .map((cap) => {
        const ys = (cap.match(/-?[\d.]+/g) ?? [])
          .map(Number)
          .filter((_, i) => i % 2 === 1);
        return Math.max(...ys) - Math.min(...ys);
      });
  };
  const plain = capDepths(false);
  const snowy = capDepths(true);
  // the same peaks, each with its snow reaching further down
  expect(snowy).toHaveLength(plain.length);
  expect(snowy.every((depth, i) => depth > plain[i])).toBe(true);
});

test("a curve sampled in even steps runs from the first point to the last", () => {
  const run = sampleCurve(
    [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ],
    false,
    10
  );
  expect(run).toHaveLength(11);
  expect(run[0]).toEqual({ x: 0, y: 0 });
  expect(run[10].x).toBeCloseTo(100, 6);
  // a closed one doesn't repeat its start
  const ring = sampleCurve(square, true, 10);
  const last = ring[ring.length - 1];
  expect(Math.hypot(last.x - ring[0].x, last.y - ring[0].y)).toBeGreaterThan(4);
});

test("features are listed by their own name, or numbered by kind", () => {
  const labels = featureLabels([
    feature("a", "hill"),
    { ...feature("b", "hill"), name: "  Cemetery Ridge " },
    feature("c", "hill"),
    feature("d", "road"),
  ]);
  expect(Array.from(labels.values())).toEqual([
    "Hill 1",
    "Cemetery Ridge",
    "Hill 3",
    "Road 1",
  ]);
});

test("saved terrain is read carefully", () => {
  expect(
    parseTerrain([{ id: "n", kind: "lake", points: square, name: " Loch " }])[0]
      .name
  ).toBe("Loch");
  expect(
    "name" in
      parseTerrain([{ id: "n", kind: "lake", points: square, name: " " }])[0]
  ).toBe(false);
  expect(
    parseTerrain([
      { id: "a", kind: "lake", points: square },
      { id: "b", kind: "volcano", points: square },
      { id: "c", kind: "lake", points: square.slice(0, 2) },
      {
        id: "d",
        kind: "road",
        points: [
          { x: 1, y: 2 },
          { x: "?", y: 1 },
          { x: 3, y: 4 },
        ],
      },
      null,
    ]).map((f) => [f.id, f.points.length])
  ).toEqual([
    ["a", 4],
    ["d", 2],
  ]);
  expect(parseTerrain(undefined)).toEqual([]);
});
