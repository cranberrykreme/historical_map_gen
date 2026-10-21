import { PathPoint, TerrainFeature, TerrainKind } from "../../types";
import { sampleCurve, TerrainStroke } from "./terrain";
import {
  battleStrokes,
  inPolygon,
  outwardNormals,
  terrainSvg,
} from "./terrainScene";

let next = 0;
const f = (
  kind: TerrainKind,
  points: PathPoint[],
  id = `f${next++}`
): TerrainFeature => ({
  id,
  kind,
  points,
});
// A rough circle as an area's points
const blob = (cx: number, cy: number, r: number, n = 10): PathPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    x: cx + Math.cos((i / n) * Math.PI * 2) * r,
    y: cy + Math.sin((i / n) * Math.PI * 2) * r,
  }));
const box = (x0: number, y0: number, x1: number, y1: number): PathPoint[] => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];
const draw = (features: TerrainFeature[], ground: "land" | "sea" = "land") =>
  battleStrokes(features, ground, 1000, 800);
const has = (strokes: TerrainStroke[], test: (s: TerrainStroke) => boolean) =>
  strokes.some(test);
// Every match of a pattern in some text
const matches = (text: string, pattern: RegExp): RegExpExecArray[] => {
  const out: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) out.push(m);
  return out;
};
// A closed shape's smooth edge, as drawn
const sampleCurveRing = (points: PathPoint[]) => sampleCurve(points, true, 4);
// The x of every point in a stroke's path data
const xs = (d: string) =>
  matches(d, /[ML](-?[\d.]+) (-?[\d.]+)/g).map((m) => Number(m[1]));

test("inside and outside a shape, and which way is out", () => {
  const square = box(0, 0, 100, 100);
  expect(inPolygon({ x: 50, y: 50 }, square)).toBe(true);
  expect(inPolygon({ x: 150, y: 50 }, square)).toBe(false);
  // the top edge's outward direction points up, whichever way round it was drawn
  expect(outwardNormals(square)[0].y).toBeLessThan(0);
  expect(outwardNormals([...square].reverse())[3].y).toBeLessThan(0);
});

test("1. a river into a lake stops at the shore and fans out into the water", () => {
  const lake = f("lake", box(500, 0, 1000, 800));
  const river = f("river", [
    { x: 100, y: 400 },
    { x: 800, y: 400 },
  ]);
  const strokes = draw([lake, river]);
  // the river's water ends near the shore, not out in the lake
  const water = strokes.find((s) => s.fill === "#6fa6db" && !s.opacity)!;
  expect(Math.max(...xs(water.d))).toBeLessThan(560);
  // the mouth: soft shapes of river water out over the lake
  expect(
    strokes.filter((s) => s.fill === "#6fa6db" && s.opacity! < 1)
  ).toHaveLength(5);
});

test("2. a river narrows to its source, but not where it runs off the battle", () => {
  const free = draw([
    f("river", [
      { x: 100, y: 400 },
      { x: 600, y: 400 },
    ]),
  ]);
  // narrowing, it's drawn as filled bands rather than a stroke of even width
  expect(has(free, (s) => s.fill === "#3f7fb8")).toBe(true);
  const offEdge = draw([
    f("river", [
      { x: 0, y: 400 },
      { x: 1000, y: 400 },
    ]),
  ]);
  expect(has(offEdge, (s) => s.stroke === "#3f7fb8" && s.width === 24)).toBe(
    true
  );
});

test("3. a road gets a bridge over a river and a ford over a stream", () => {
  const road = f("road", [
    { x: 500, y: 0 },
    { x: 500, y: 800 },
  ]);
  const bridged = draw([
    f("river", [
      { x: 0, y: 400 },
      { x: 1000, y: 400 },
    ]),
    road,
  ]);
  expect(has(bridged, (s) => s.stroke === "#a0784a")).toBe(true);
  const forded = draw([
    f("stream", [
      { x: 0, y: 400 },
      { x: 1000, y: 400 },
    ]),
    road,
  ]);
  expect(has(forded, (s) => s.fill === "#c4bfb0")).toBe(true);
  // no second bridge where one has been drawn
  const own = f("bridge", [
    { x: 500, y: 380 },
    { x: 500, y: 420 },
  ]);
  const once = draw([
    f("river", [
      { x: 0, y: 400 },
      { x: 1000, y: 400 },
    ]),
    road,
    own,
  ]);
  expect(once.filter((s) => s.stroke === "#a0784a")).toHaveLength(1);
});

test("3. walls break at rivers and stop at the water's edge", () => {
  const wall = f("wall", [
    { x: 500, y: 20 },
    { x: 500, y: 780 },
  ]);
  const strokes = draw([
    f("river", [
      { x: 0, y: 400 },
      { x: 1000, y: 400 },
    ]),
    wall,
  ]);
  const stones = strokes.find((s) => s.stroke === "#6f6a5f")!;
  // two pieces, one either side of the river
  expect((stones.d.match(/M/g) ?? []).length).toBe(2);
  const sea = draw([f("deep", box(0, 400, 1000, 800)), wall]);
  expect(
    (sea.find((s) => s.stroke === "#6f6a5f")!.d.match(/M/g) ?? []).length
  ).toBe(1);
});

// The middle and radius of every circle in a stroke's path data (trees, towers)
const circles = (d: string) =>
  matches(d, /M(-?[\d.]+) (-?[\d.]+)a([\d.]+) /g).map((m) => ({
    x: Number(m[1]) + Number(m[3]),
    y: Number(m[2]),
    r: Number(m[3]),
  }));
// Each roof's lit half, and its shaded half
const LIT = ["#b8704f", "#ac6650", "#bb7655", "#a45f47"];
const ROOFS = [...LIT, "#8a4c37", "#7f4734", "#905239", "#76432f"];

test("4. a road clears a lane through a wood, and no tree is cut by it", () => {
  const road = f("road", [
    { x: 0, y: 400 },
    { x: 1000, y: 400 },
  ]);
  const wood = draw([f("forest", blob(500, 400, 200)), road]);
  // the lane runs the whole road but is clipped to the wood, so it ends at the wood's edge
  const lane = wood.find((s) => s.stroke === "#8fae62" && s.width === 32)!;
  expect(lane.clip).toBeTruthy();
  expect(Math.min(...xs(lane.d))).toBe(0);
  // every tree stands wholly clear of the lane
  const trees = wood
    .filter((s) => s.stroke === "#34591f" || s.stroke === "#2f521b")
    .flatMap((s) => circles(s.d));
  expect(trees.length).toBeGreaterThan(50);
  expect(trees.every((t) => Math.abs(t.y - 400) >= 19 + t.r)).toBe(true);
});

test("4. a road through a town is a street lined with whole houses", () => {
  const road = f("road", [
    { x: 0, y: 400 },
    { x: 1000, y: 400 },
  ]);
  const town = draw([f("town", blob(500, 400, 200)), road]);
  expect(has(town, (s) => s.stroke === "#bfb193" && !!s.clip)).toBe(true);
  const roofs = town.filter((s) => ROOFS.includes(s.fill ?? ""));
  // houses are drawn whole, not clipped to the town
  expect(roofs.every((s) => !s.clip)).toBe(true);
  expect(
    roofs.map((s) => (s.d.match(/M/g) ?? []).length).reduce((a, b) => a + b)
  ).toBeGreaterThan(30);
});

test("4. no houses are built on a crossing street", () => {
  const across = f("road", [
    { x: 0, y: 400 },
    { x: 1000, y: 400 },
  ]);
  const down = f("road", [
    { x: 500, y: 0 },
    { x: 500, y: 800 },
  ]);
  const strokes = draw([f("town", blob(500, 400, 250)), across, down]);
  const corners = strokes
    .filter((s) => ROOFS.includes(s.fill ?? ""))
    .flatMap((s) => matches(s.d, /[ML](-?[\d.]+) (-?[\d.]+)/g))
    .map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
  // every house keeps clear of the middle of both roads
  expect(
    corners.every((p) => Math.abs(p.x - 500) > 7 && Math.abs(p.y - 400) > 7)
  ).toBe(true);
});

test("4. a town's streets are lined with terraces (no gardens); big towns get a square and a church", () => {
  const town = draw([
    f("town", blob(500, 400, 320)),
    f("road", [
      { x: 0, y: 380 },
      { x: 1000, y: 380 },
    ]),
  ]);
  // terrace houses with no back gardens
  expect(has(town, (s) => s.fill === "#a3bb72")).toBe(false);
  // a paved market square, with a well
  expect(has(town, (s) => s.fill === "#d8ccad")).toBe(true);
  expect(has(town, (s) => s.fill === "#7a8a98")).toBe(true);
  // a stone church with its tower
  expect(has(town, (s) => s.fill === "#9a958b")).toBe(true);
  expect(has(town, (s) => s.fill === "#a39d92")).toBe(true);
  // old-town blocks round courtyards
  expect(has(town, (s) => s.fill === "#b8ab88")).toBe(true);
  // a small town has none of the square or church
  const small = draw([
    f("town", blob(500, 400, 90)),
    f("road", [
      { x: 0, y: 400 },
      { x: 1000, y: 400 },
    ]),
  ]);
  expect(has(small, (s) => s.fill === "#d8ccad" || s.fill === "#9a958b")).toBe(
    false
  );
});

test("7. trees grow over a ridge, bigger along its crest", () => {
  const forest = f("forest", box(100, 100, 900, 700));
  const ridge = f("ridge", [
    { x: 100, y: 400 },
    { x: 900, y: 400 },
  ]);
  const trees = draw([forest, ridge])
    .filter((s) => s.stroke === "#34591f" || s.stroke === "#2f521b")
    .flatMap((s) => circles(s.d));
  const onCrest = trees.filter((t) => Math.abs(t.y - 400) < 8);
  const away = trees.filter((t) => Math.abs(t.y - 400) > 60);
  // trees stand on the ridge rather than keeping clear of it
  expect(onCrest.length).toBeGreaterThan(5);
  const mean = (list: { r: number }[]) =>
    list.reduce((a, t) => a + t.r, 0) / list.length;
  expect(mean(onCrest)).toBeGreaterThan(mean(away) * 1.1);
});

test("4. a walled town has a wall with towers, and a gate where a road comes in", () => {
  const closed = draw([f("walled", blob(500, 400, 200))]);
  const wall = closed.find((s) => s.stroke === "#6f6a5f")!;
  expect((wall.d.match(/M/g) ?? []).length).toBe(1);
  expect(
    circles(closed.find((s) => s.fill === "#9a958a")!.d).length
  ).toBeGreaterThan(8);
  const gated = draw([
    f("walled", blob(500, 400, 200)),
    f("road", [
      { x: 0, y: 400 },
      { x: 1000, y: 400 },
    ]),
  ]);
  // two gates split the wall into two pieces, with nothing of it on the road
  const pieces = gated.find((s) => s.stroke === "#6f6a5f")!;
  expect((pieces.d.match(/M/g) ?? []).length).toBe(2);
  const wallPoints = matches(pieces.d, /[ML](-?[\d.]+) (-?[\d.]+)/g).map((m) =>
    Number(m[2])
  );
  expect(wallPoints.every((y) => Math.abs(y - 400) > 7)).toBe(true);
});

test("5. an island gets surf; a sea in a land battle a beach; a lake a crisp edge and a damp bank", () => {
  const island = draw([f("land", blob(500, 400, 200))], "sea");
  expect(has(island, (s) => s.stroke === "#eaf4f8")).toBe(true);
  // land in a land battle isn't a coast
  expect(
    has(draw([f("land", blob(500, 400, 200))]), (s) => s.stroke === "#eaf4f8")
  ).toBe(false);
  expect(
    has(draw([f("deep", blob(500, 400, 200))]), (s) => s.stroke === "#dccb93")
  ).toBe(true);
  expect(
    has(draw([f("lake", blob(500, 400, 200))]), (s) => s.stroke === "#6f8f4f")
  ).toBe(true);
  // a crisp edge traces the lake's shore, and there's no sand round it
  const lake = draw([f("lake", blob(500, 400, 200))]);
  expect(has(lake, (s) => s.stroke === "#2f6aa0" && s.width === 3)).toBe(true);
  expect(
    has(lake, (s) => s.stroke === "#dccb93" || s.stroke === "#cfc18a")
  ).toBe(false);
  // a lake out at sea has no shore
  expect(
    has(
      draw([f("lake", blob(500, 400, 200))], "sea"),
      (s) => s.stroke === "#6f8f4f"
    )
  ).toBe(false);
});

test("6. overlapping areas of a kind draw every outline under every fill", () => {
  const strokes = draw([
    f("forest", blob(400, 400, 150)),
    f("forest", blob(550, 400, 150)),
  ]);
  const outlines = strokes
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.stroke === "#4a7030");
  const fills = strokes
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.fill === "#5f8a3c");
  expect(outlines).toHaveLength(2);
  expect(fills).toHaveLength(2);
  expect(Math.max(...outlines.map((o) => o.i))).toBeLessThan(
    Math.min(...fills.map((o) => o.i))
  );
});

test("7. high ground is shaded, casts a shadow, and its trees are bigger and drawn on top", () => {
  const hill = f("hill", blob(500, 400, 300));
  const forest = f("forest", blob(500, 400, 290));
  const strokes = draw([hill, forest]);
  // shading over the hill's rings, drawn after the trees on it
  const shade = strokes
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.fill === "pattern:shade");
  expect(shade).toHaveLength(3);
  const treeLayers = strokes
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.stroke === "#34591f");
  expect(Math.max(...treeLayers.map((t) => t.i))).toBeLessThan(shade[0].i);
  // a soft shadow under it
  expect(has(strokes, (s) => s.fill === "#2a2a10")).toBe(true);
  // trees near the top are bigger than trees at the foot, and in later (higher) layers
  const trees = treeLayers.flatMap(({ s, i }) =>
    circles(s.d).map((c) => ({ ...c, layer: i }))
  );
  const top = trees.filter((t) => Math.hypot(t.x - 500, t.y - 400) < 80);
  const foot = trees.filter((t) => Math.hypot(t.x - 500, t.y - 400) > 240);
  const mean = (list: { r: number }[]) =>
    list.reduce((a, t) => a + t.r, 0) / list.length;
  expect(mean(top)).toBeGreaterThan(mean(foot) * 1.1);
  expect(Math.min(...top.map((t) => t.layer))).toBeGreaterThan(
    Math.max(...foot.map((t) => t.layer))
  );
});

test("9. under snow: snowy trees and white ground, white roofs, dusted roads, frozen water", () => {
  const snow = f("snow", box(0, 0, 1000, 800));
  const woods = draw([f("forest", blob(300, 300, 150)), snow]);
  expect(has(woods, (s) => s.fill === "#f4f7f9" && s.opacity === 0.9)).toBe(
    true
  ); // on the trees
  expect(
    has(woods, (s) => s.fill === "#f4f7f9" && s.opacity === 0.6 && !!s.clip)
  ).toBe(true); // the ground
  const town = draw([
    f("town", blob(500, 400, 200)),
    f("road", [
      { x: 0, y: 400 },
      { x: 1000, y: 400 },
    ]),
    snow,
  ]);
  expect(has(town, (s) => s.fill === "#f3f6f8")).toBe(true);
  expect(has(town, (s) => s.stroke === "#f1f4f6" && !!s.dash)).toBe(true);
  const water = draw([
    f("lake", blob(500, 400, 200)),
    f("river", [
      { x: 0, y: 100 },
      { x: 1000, y: 100 },
    ]),
    snow,
  ]);
  expect(has(water, (s) => s.fill === "pattern:ice" && !!s.clip)).toBe(true);
  expect(has(water, (s) => s.stroke === "#e3eff5")).toBe(true);
  // and a light dusting over it all
  expect(has(water, (s) => s.fill === "#ffffff")).toBe(true);
});

test("7. trees are never partly hidden under a town drawn over them", () => {
  const townPoints = blob(500, 400, 150);
  const strokes = draw([
    f("forest", blob(400, 400, 250)),
    f("town", townPoints),
  ]);
  const trees = strokes
    .filter((s) => s.stroke === "#34591f" || s.stroke === "#2f521b")
    .flatMap((s) => circles(s.d));
  expect(trees.length).toBeGreaterThan(20);
  // the town's edge line reaches 3 past its shape, and no tree comes within it
  const edge = sampleCurveRing(townPoints);
  for (const t of trees)
    expect(edge.every((p) => Math.hypot(p.x - t.x, p.y - t.y) >= t.r + 3)).toBe(
      true
    );
});

test("4. on a tight bend no two street houses overlap", () => {
  const road = f("road", [
    { x: 0, y: 400 },
    { x: 480, y: 400 },
    { x: 520, y: 440 },
    { x: 480, y: 480 },
    { x: 0, y: 480 },
  ]);
  const strokes = draw([f("town", blob(400, 440, 300)), road]);
  const houses = strokes
    .filter((s) => LIT.includes(s.fill ?? ""))
    .flatMap((s) => s.d.split("M").filter(Boolean))
    .map((roofPath) => {
      const n = (roofPath.match(/-?[\d.]+/g) ?? []).map(Number);
      const xsOf = n.filter((_, i) => i % 2 === 0);
      const ysOf = n.filter((_, i) => i % 2 === 1);
      return {
        x: xsOf.reduce((a, b) => a + b) / xsOf.length,
        y: ysOf.reduce((a, b) => a + b) / ysOf.length,
      };
    });
  // houses along the street keep apart from each other: terrace houses side by side are a
  // house's width apart, never on top of each other
  const street = houses.filter(
    (h) => Math.abs(h.y - 400) < 30 || Math.abs(h.y - 480) < 30 || h.x > 470
  );
  expect(street.length).toBeGreaterThan(10);
  for (let i = 0; i < street.length; i++)
    for (let j = i + 1; j < street.length; j++)
      expect(
        Math.hypot(street[i].x - street[j].x, street[i].y - street[j].y)
      ).toBeGreaterThan(6);
});

// Every house outline in some strokes, as its four corners
const outlines = (strokes: TerrainStroke[]) =>
  strokes
    .filter((s) => s.stroke === "#5e3d2b")
    .flatMap((s) => s.d.split("M").filter(Boolean))
    .map((part) => {
      const n = (part.match(/-?[\d.]+/g) ?? []).map(Number);
      return [0, 2, 4, 6].map((k) => ({ x: n[k], y: n[k + 1] }));
    });
// How far two outlines overlap (0 when they only touch or are apart)
const overlapDepth = (a: PathPoint[], b: PathPoint[]) => {
  let least = Infinity;
  for (const poly of [a, b])
    for (let i = 0; i < 4; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % 4];
      const l = Math.hypot(q.x - p.x, q.y - p.y) || 1;
      const ax = -(q.y - p.y) / l;
      const ay = (q.x - p.x) / l;
      const pa = a.map((v) => v.x * ax + v.y * ay);
      const pb = b.map((v) => v.x * ax + v.y * ay);
      least = Math.min(
        least,
        Math.min(Math.max(...pa), Math.max(...pb)) -
          Math.max(Math.min(...pa), Math.min(...pb))
      );
    }
  return Math.max(0, least);
};

test("4. round curves and tight bends: no two houses' outlines overlap", () => {
  const roads = [
    // a wide curve, like an S through town
    [
      { x: 100, y: 200 },
      { x: 400, y: 260 },
      { x: 560, y: 420 },
      { x: 640, y: 640 },
    ],
    // a hairpin
    [
      { x: 0, y: 400 },
      { x: 480, y: 400 },
      { x: 520, y: 440 },
      { x: 480, y: 480 },
      { x: 0, y: 480 },
    ],
    // a sharp corner
    [
      { x: 200, y: 150 },
      { x: 500, y: 450 },
      { x: 800, y: 300 },
    ],
  ];
  for (const points of roads) {
    const houses = outlines(
      draw([f("town", blob(450, 420, 340)), f("road", points)])
    );
    expect(houses.length).toBeGreaterThan(20);
    for (let i = 0; i < houses.length; i++)
      for (let j = i + 1; j < houses.length; j++)
        expect(overlapDepth(houses[i], houses[j])).toBeLessThan(0.5);
  }
});

test("1. a river into the sea is clipped to the land, so it ends at the beach's edge", () => {
  const island = f("land", blob(500, 400, 250));
  const river = f("river", [
    { x: 500, y: 300 },
    { x: 500, y: 790 },
  ]);
  const strokes = draw([island, river], "sea");
  const water = strokes.filter((s) => s.fill === "#6fa6db" && !s.opacity);
  expect(water.length).toBeGreaterThan(0);
  expect(water.every((s) => Array.isArray(s.clip) && s.clip.length === 1)).toBe(
    true
  );
});

test("8. marsh beside water softens into it", () => {
  const marsh = f("marsh", box(200, 200, 520, 600));
  const strokes = draw([f("lake", box(500, 0, 1000, 800)), marsh]);
  // wetter bands along the shore, clipped so they never spill onto the grass
  const wet = strokes.filter((s) => s.stroke === "#6f9fa0");
  expect(wet).toHaveLength(3);
  expect(wet.every((s) => !!s.clip)).toBe(true);
  expect(has(draw([marsh]), (s) => s.stroke === "#6f9fa0")).toBe(false);
});

test("the battleground SVG gives each clipped stroke its own clip path", () => {
  const svg = terrainSvg({
    id: "b",
    name: "B",
    kind: "land",
    width: 1000,
    height: 800,
    terrain: [f("forest", blob(500, 400, 200)), f("snow", blob(500, 300, 150))],
  });
  const ids = matches(svg, /<clipPath id="([^"]+)"/g).map((m) => m[1]);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
});
