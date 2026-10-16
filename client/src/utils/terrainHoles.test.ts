import { PathPoint, TerrainFeature } from "../types";
import { featurePath, parseTerrain, sampleCurve } from "./terrain";
import { battleStrokes, terrainSvg } from "./terrainScene";

// A rough circle as an area's points
const blob = (cx: number, cy: number, r: number, n = 10): PathPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    x: cx + Math.cos((i / n) * Math.PI * 2) * r,
    y: cy + Math.sin((i / n) * Math.PI * 2) * r,
  }));
const draw = (features: TerrainFeature[]) =>
  battleStrokes(features, "land", 1000, 800);
// The middle and radius of every circle in a stroke's path data
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

const hole = blob(500, 400, 100);
const clearing: TerrainFeature = {
  id: "f",
  kind: "forest",
  points: blob(500, 400, 300),
  holes: [hole],
};

test("a clearing has no trees in it, and none cut by its edge", () => {
  const trees = draw([clearing])
    .filter((s) => s.stroke === "#34591f" || s.stroke === "#2f521b")
    .flatMap((s) => circles(s.d));
  expect(trees.length).toBeGreaterThan(50);
  const edge = sampleCurve(hole, true, 4);
  for (const t of trees) {
    const nearest = Math.min(
      ...edge.map((p) => Math.hypot(p.x - t.x, p.y - t.y))
    );
    expect(Math.hypot(t.x - 500, t.y - 400) > 100 && nearest >= t.r).toBe(true);
  }
});

test("an area with holes is filled even-odd, so the holes show the ground", () => {
  const strokes = draw([clearing]);
  const fill = strokes.find((s) => s.fill === "#5f8a3c")!;
  expect(fill.fillRule).toBe("evenodd");
  expect((fill.d.match(/M/g) ?? []).length).toBe(2);
  // without holes, nothing changes
  expect(
    draw([{ ...clearing, holes: undefined }]).some((s) => !!s.fillRule)
  ).toBe(false);
  expect(featurePath(clearing)).toBe(fill.d);
  const svg = terrainSvg({
    id: "b",
    name: "B",
    kind: "land",
    width: 1000,
    height: 800,
    terrain: [clearing],
  });
  expect(svg).toContain('fill-rule="evenodd"');
});

test("an island in a lake gets a shoreline round it", () => {
  const lake: TerrainFeature = {
    id: "l",
    kind: "lake",
    points: blob(500, 400, 300),
    holes: [hole],
  };
  const shores = draw([lake]).filter(
    (s) => s.stroke === "#2f6aa0" && s.width === 3
  );
  // the lake's own shore, and the island's
  expect(
    shores.map((s) => (s.d.match(/M/g) ?? []).length).reduce((a, b) => a + b, 0)
  ).toBe(2);
});

test("a road through a clearing only cuts a lane where there are trees", () => {
  const road: TerrainFeature = {
    id: "r",
    kind: "road",
    points: [
      { x: 0, y: 400 },
      { x: 1000, y: 400 },
    ],
  };
  const lane = draw([clearing, road]).find(
    (s) => s.stroke === "#8fae62" && s.width === 32
  )!;
  expect(lane.clipRule).toBe("evenodd");
});

test("holes are read back from a saved project, and bad ones dropped", () => {
  const saved = [
    {
      id: "a",
      kind: "forest",
      points: blob(0, 0, 100),
      holes: [blob(0, 0, 20), [{ x: 1, y: 1 }], "junk"],
    },
    {
      id: "b",
      kind: "road",
      points: [
        { x: 0, y: 0 },
        { x: 9, y: 9 },
      ],
      holes: [blob(0, 0, 20)],
    },
  ];
  const [forest, road] = parseTerrain(saved);
  expect(forest.holes).toHaveLength(1);
  expect(road.holes).toBeUndefined();
});
