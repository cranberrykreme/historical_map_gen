import { BattleKind, PathPoint, TerrainFeature, TerrainKind } from "../types";

// ---- What can be drawn ----

export type TerrainShape = "area" | "line";

export type TerrainGroup =
  | "Water"
  | "Ground"
  | "High ground"
  | "Woods & towns"
  | "Lines";

export interface TerrainKindInfo {
  kind: TerrainKind;
  label: string;
  shape: TerrainShape;
  group: TerrainGroup;
  hint: string;
}

// In the order they're drawn, bottom to top: water first, then open ground, high ground,
// woods and towns, and the lines (rivers, roads, walls) over everything. The panel offers
// them by group.
export const TERRAIN_KINDS: TerrainKindInfo[] = [
  {
    kind: "deep",
    label: "Deep water",
    shape: "area",
    group: "Water",
    hint: "Dark open sea, with waves",
  },
  {
    kind: "shallows",
    label: "Shallows",
    shape: "area",
    group: "Water",
    hint: "Light, shallow water near a shore",
  },
  {
    kind: "lake",
    label: "Lake",
    shape: "area",
    group: "Water",
    hint: "Still water: lakes, ponds, the sea in a land battle",
  },
  {
    kind: "reef",
    label: "Reef",
    shape: "area",
    group: "Water",
    hint: "Rocks just under the water: a hazard for ships",
  },
  {
    kind: "land",
    label: "Land",
    shape: "area",
    group: "Ground",
    hint: "Dry land with a sandy shore: islands and coasts in a sea battle",
  },
  {
    kind: "sand",
    label: "Sand",
    shape: "area",
    group: "Ground",
    hint: "Beaches, dunes and sandbanks",
  },
  {
    kind: "field",
    label: "Field",
    shape: "area",
    group: "Ground",
    hint: "Farmland, ploughed in rows",
  },
  {
    kind: "scrub",
    label: "Scrub",
    shape: "area",
    group: "Ground",
    hint: "Rough ground with bushes and gorse",
  },
  {
    kind: "marsh",
    label: "Marsh",
    shape: "area",
    group: "Ground",
    hint: "Wet, boggy ground",
  },
  {
    kind: "snow",
    label: "Snow",
    shape: "area",
    group: "Ground",
    hint: "Snow-covered ground",
  },
  {
    kind: "rocks",
    label: "Rocks",
    shape: "area",
    group: "High ground",
    hint: "Stony, broken ground",
  },
  {
    kind: "hill",
    label: "Hill",
    shape: "area",
    group: "High ground",
    hint: "High ground, shaded in rings that rise to the top",
  },
  {
    kind: "mountain",
    label: "Mountain",
    shape: "area",
    group: "High ground",
    hint: "Mountains, drawn as peaks",
  },
  {
    kind: "forest",
    label: "Forest",
    shape: "area",
    group: "Woods & towns",
    hint: "Broadleaf woodland",
  },
  {
    kind: "pines",
    label: "Pines",
    shape: "area",
    group: "Woods & towns",
    hint: "A pine or fir forest",
  },
  {
    kind: "orchard",
    label: "Orchard",
    shape: "area",
    group: "Woods & towns",
    hint: "Trees planted in neat rows",
  },
  {
    kind: "town",
    label: "Town",
    shape: "area",
    group: "Woods & towns",
    hint: "A village or town: roofs and lanes",
  },
  {
    kind: "walled",
    label: "Walled town",
    shape: "area",
    group: "Woods & towns",
    hint: "A town inside stone walls and towers, with a gate wherever a road comes in",
  },
  {
    kind: "river",
    label: "River",
    shape: "line",
    group: "Lines",
    hint: "A wide river: draw it from its source, and it widens as it flows into the sea or a lake",
  },
  {
    kind: "stream",
    label: "Stream",
    shape: "line",
    group: "Lines",
    hint: "A stream or brook: draw it from its source; it can run into a river",
  },
  {
    kind: "ditch",
    label: "Ditch",
    shape: "line",
    group: "Lines",
    hint: "A dug ditch or dyke",
  },
  {
    kind: "road",
    label: "Road",
    shape: "line",
    group: "Lines",
    hint: "A road or track: it gets a bridge or a ford where it crosses a river or stream",
  },
  {
    kind: "bridge",
    label: "Bridge",
    shape: "line",
    group: "Lines",
    hint: "A wooden bridge: draw it across a river",
  },
  {
    kind: "ridge",
    label: "Ridge",
    shape: "line",
    group: "Lines",
    hint: "A long, narrow hill: draw along its crest",
  },
  {
    kind: "cliff",
    label: "Cliff",
    shape: "line",
    group: "Lines",
    hint: "A cliff edge: the rocks hang down the drop, on the right of the way you draw it",
  },
  {
    kind: "wall",
    label: "Wall",
    shape: "line",
    group: "Lines",
    hint: "A stone wall",
  },
  {
    kind: "palisade",
    label: "Palisade",
    shape: "line",
    group: "Lines",
    hint: "A wooden stockade: a fence of stakes",
  },
];

export const TERRAIN_GROUPS: TerrainGroup[] = [
  "Water",
  "Ground",
  "High ground",
  "Woods & towns",
  "Lines",
];

export const kindInfo = (kind: TerrainKind): TerrainKindInfo =>
  TERRAIN_KINDS.find((k) => k.kind === kind) ?? TERRAIN_KINDS[0];

export const isLine = (kind: TerrainKind) => kindInfo(kind).shape === "line";

// The fewest points each shape can have
export const minPoints = (kind: TerrainKind) => (isLine(kind) ? 2 : 3);

// The ground under everything, the same colours the editor shows
export const GROUND_COLOUR: Record<BattleKind, string> = {
  land: "#8fae62",
  sea: "#4a78a0",
};

export const newTerrainId = () =>
  `terrain-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// ---- Shapes ----

const round = (n: number) => Math.round(n * 100) / 100;

// The Bézier segments of a smooth curve through every point (Catmull-Rom). A closed curve
// runs back round to the first point.
function curveSegments(
  points: PathPoint[],
  closed: boolean
): [PathPoint, PathPoint, PathPoint, PathPoint][] {
  const n = points.length;
  if (n < 2) return [];
  const at = (i: number) =>
    closed ? points[(i + n) % n] : points[Math.min(Math.max(i, 0), n - 1)];
  const segments: [PathPoint, PathPoint, PathPoint, PathPoint][] = [];
  const count = closed ? n : n - 1;
  for (let i = 0; i < count; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    segments.push([
      p1,
      { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      p2,
    ]);
  }
  return segments;
}

// A smooth curve through every point, as SVG path data
export function smoothPath(points: PathPoint[], closed: boolean): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${round(points[0].x)} ${round(points[0].y)}`;
  if (n === 2 && !closed)
    return `M${round(points[0].x)} ${round(points[0].y)}L${round(points[1].x)} ${round(points[1].y)}`;
  let d = `M${round(points[0].x)} ${round(points[0].y)}`;
  for (const [, c1, c2, p2] of curveSegments(points, closed)) {
    d += `C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(p2.x)} ${round(p2.y)}`;
  }
  return closed ? `${d}Z` : d;
}

// The smooth curve through the points as many short straight steps, `step` map units apart
// (the last step may be shorter). A closed curve doesn't repeat its first point at the end.
export function sampleCurve(
  points: PathPoint[],
  closed: boolean,
  step = 6
): PathPoint[] {
  if (points.length < 2) return points.map(({ x, y }) => ({ x, y }));
  const dense: PathPoint[] = [];
  const segments =
    points.length === 2 && !closed
      ? ([[points[0], points[0], points[1], points[1]]] as const)
      : curveSegments(points, closed);
  for (const [p0, c1, c2, p1] of segments) {
    for (let k = 0; k < 24; k++) {
      const t = k / 24;
      const u = 1 - t;
      dense.push({
        x:
          u * u * u * p0.x +
          3 * u * u * t * c1.x +
          3 * u * t * t * c2.x +
          t * t * t * p1.x,
        y:
          u * u * u * p0.y +
          3 * u * u * t * c1.y +
          3 * u * t * t * c2.y +
          t * t * t * p1.y,
      });
    }
  }
  dense.push(closed ? points[0] : points[points.length - 1]);
  // even steps along it
  const out: PathPoint[] = [{ ...dense[0] }];
  let carried = 0;
  for (let i = 1; i < dense.length; i++) {
    const a = dense[i - 1];
    const b = dense[i];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length === 0) continue;
    let along = step - carried;
    while (along <= length) {
      out.push({
        x: a.x + ((b.x - a.x) * along) / length,
        y: a.y + ((b.y - a.y) * along) / length,
      });
      along += step;
    }
    carried = (carried + length) % step;
  }
  const last = dense[dense.length - 1];
  const tail = out[out.length - 1];
  if (closed) {
    // the closing step back to the start is implied
    if (
      out.length > 2 &&
      Math.hypot(tail.x - last.x, tail.y - last.y) < step / 2
    )
      out.pop();
  } else if (Math.hypot(tail.x - last.x, tail.y - last.y) > 0.01) {
    out.push({ ...last });
  }
  return out;
}

// Points along a run of straight steps, `spacing` apart, each with the run's direction there
// (a unit vector). For the details along cliffs, palisades and bridges.
export function alongLine(
  run: PathPoint[],
  spacing: number
): { x: number; y: number; dx: number; dy: number }[] {
  const out: { x: number; y: number; dx: number; dy: number }[] = [];
  let carried = spacing / 2;
  for (let i = 1; i < run.length; i++) {
    const a = run[i - 1];
    const b = run[i];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length === 0) continue;
    const dx = (b.x - a.x) / length;
    const dy = (b.y - a.y) / length;
    let along = spacing - carried;
    while (along <= length) {
      out.push({ x: a.x + dx * along, y: a.y + dy * along, dx, dy });
      along += spacing;
    }
    carried = (carried + length) % spacing;
  }
  return out;
}

// Points along the smooth curve through `points`, about `spacing` apart, with its direction
export const alongCurve = (points: PathPoint[], spacing: number) =>
  alongLine(sampleCurve(points, false, 2), spacing);

// A run of straight steps as SVG path data
export function polylinePath(run: PathPoint[], closed = false): string {
  if (run.length === 0) return "";
  return (
    run
      .map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`)
      .join("") + (closed ? "Z" : "")
  );
}

// A circle as SVG path data
export const circlePath = (x: number, y: number, r: number) =>
  `M${round(x - r)} ${round(y)}a${round(r)} ${round(r)} 0 1 0 ${round(2 * r)} 0a${round(r)} ${round(r)} 0 1 0 ${round(-2 * r)} 0Z`;

// Short strokes across a run: to its right (side 1), its left (-1), or both (0)
export function ticks(
  run: PathPoint[],
  spacing: number,
  length: number,
  side: 1 | -1 | 0
): string {
  return alongLine(run, spacing)
    .map(({ x, y, dx, dy }) => {
      // the right of the direction of travel, on screen (y points down)
      const nx = -dy;
      const ny = dx;
      const from = side === 0 ? -length / 2 : 0;
      const to = side === 0 ? length / 2 : length * side;
      return `M${round(x + nx * from)} ${round(y + ny * from)}L${round(x + nx * to)} ${round(y + ny * to)}`;
    })
    .join("");
}

// Little round heads along a run, like the tops of stakes
function dots(run: PathPoint[], spacing: number, r: number): string {
  return alongLine(run, spacing)
    .map(({ x, y }) => circlePath(x, y, r))
    .join("");
}

// Triangles hanging off the right of a run (the drop of a cliff)
function teeth(
  run: PathPoint[],
  spacing: number,
  width: number,
  depth: number
): string {
  return alongLine(run, spacing)
    .map(({ x, y, dx, dy }) => {
      const nx = -dy;
      const ny = dx;
      const h = width / 2;
      return (
        `M${round(x - dx * h)} ${round(y - dy * h)}` +
        `L${round(x + dx * h)} ${round(y + dy * h)}` +
        `L${round(x + nx * depth)} ${round(y + ny * depth)}Z`
      );
    })
    .join("");
}

// A band along a run whose width changes along it: a river narrowing to its source
function ribbon(run: PathPoint[], width: (along: number) => number): string {
  if (run.length < 2) return "";
  const lengths = [0];
  for (let i = 1; i < run.length; i++)
    lengths.push(
      lengths[i - 1] +
        Math.hypot(run[i].x - run[i - 1].x, run[i].y - run[i - 1].y)
    );
  const left: PathPoint[] = [];
  const right: PathPoint[] = [];
  run.forEach((p, i) => {
    const a = run[Math.max(i - 1, 0)];
    const b = run[Math.min(i + 1, run.length - 1)];
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / length;
    const ny = (b.x - a.x) / length;
    const h = width(lengths[i]) / 2;
    left.push({ x: p.x - nx * h, y: p.y - ny * h });
    right.push({ x: p.x + nx * h, y: p.y + ny * h });
  });
  return polylinePath([...left, ...right.reverse()], true);
}

// The length of a run of straight steps
export function runLength(run: PathPoint[]): number {
  let length = 0;
  for (let i = 1; i < run.length; i++)
    length += Math.hypot(run[i].x - run[i - 1].x, run[i].y - run[i - 1].y);
  return length;
}

export function centroid(points: PathPoint[]): PathPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

// The middle of the shape the points go round, weighing every part of it alike (so it stays in
// the middle however unevenly the points are spaced, as the brush leaves them). The average
// of the points for a shape with no area.
export function areaCentre(points: PathPoint[]): PathPoint {
  let twice = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const cross = a.x * b.y - b.x * a.y;
    twice += cross;
    x += (a.x + b.x) * cross;
    y += (a.y + b.y) * cross;
  }
  if (Math.abs(twice) < 1e-9) return centroid(points);
  return { x: x / (3 * twice), y: y / (3 * twice) };
}

// The shape drawn smaller towards its middle: a hill's higher rings
export function shrink(points: PathPoint[], factor: number): PathPoint[] {
  const c = areaCentre(points);
  return points.map((p) => ({
    x: c.x + (p.x - c.x) * factor,
    y: c.y + (p.y - c.y) * factor,
  }));
}

// Where a new point goes on a shape: after the point that starts the edge nearest to `at`
// (closed shapes include the edge from the last point back to the first)
export function insertionIndex(
  points: PathPoint[],
  at: PathPoint,
  closed: boolean
): number {
  let best = points.length;
  let bestDistance = Infinity;
  const edges = closed ? points.length : points.length - 1;
  for (let i = 0; i < edges; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    const t =
      lengthSq === 0
        ? 0
        : Math.min(
            Math.max(((at.x - a.x) * dx + (at.y - a.y) * dy) / lengthSq, 0),
            1
          );
    const distance = Math.hypot(a.x + dx * t - at.x, a.y + dy * t - at.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i + 1;
    }
  }
  return best;
}

// ---- How each kind looks ----

// One layer of a feature's drawing. Each feature is a few of these, drawn in order.
export interface TerrainStroke {
  d: string;
  fill?: string; // a colour, or a pattern by name: "pattern:sand"
  stroke?: string;
  width?: number;
  opacity?: number;
  dash?: string; // an SVG dash pattern, e.g. "8 4"
  cap?: "round" | "butt";
  // Only drawn inside this closed shape (SVG path data), or inside any of these shapes
  clip?: string | string[];
  clipRule?: "evenodd"; // a clip shape with holes cut in it
  fillRule?: "evenodd"; // a shape with holes cut in it
  shading?: boolean; // light and shadow on high ground, left out by flat styles
}

const PATTERN = (name: string) => `pattern:${name}`;

// An area's holes as SVG path data, to add to its outline: drawn with the even-odd rule, they
// cut through the shape
export const holesPath = (feature: TerrainFeature) =>
  (feature.holes ?? []).map((hole) => smoothPath(hole, true)).join("");

// A feature's whole shape as SVG path data: an area's edge and its holes, or a line
export const featurePath = (feature: TerrainFeature) =>
  isLine(feature.kind)
    ? smoothPath(feature.points, false)
    : smoothPath(feature.points, true) + holesPath(feature);

// The drawing of one feature on its own, bottom to top: its shape, then the trees, peaks or
// houses scattered over it (a battleground also has the ways features meet: see terrainScene)
export function featureStrokes(
  feature: TerrainFeature,
  scatter?: ScatterContext
): TerrainStroke[] {
  return [...baseStrokes(feature), ...scatterItems(feature, scatter)];
}

// A feature's shape: its fill and edge, a hill's rings, a texture; no scattered items
export function baseStrokes(feature: TerrainFeature): TerrainStroke[] {
  if (isLine(feature.kind))
    return lineStrokes(feature.kind, [
      { run: sampleCurve(feature.points, false, 4) },
    ]);
  const strokes = areaStrokes(feature);
  // with holes, every layer has them cut through it
  return feature.holes?.length
    ? strokes.map((s) => ({ ...s, fillRule: "evenodd" as const }))
    : strokes;
}

function areaStrokes(feature: TerrainFeature): TerrainStroke[] {
  const { points } = feature;
  const holes = holesPath(feature);
  const area = (pts: PathPoint[] = points) => smoothPath(pts, true) + holes;
  switch (feature.kind) {
    // water
    case "deep":
      return [
        { d: area(), fill: "#33608a", stroke: "#2b5379", width: 3 },
        { d: area(), fill: PATTERN("waves") },
      ];
    case "shallows":
      return [{ d: area(), fill: "#7fb6d9", stroke: "#a3cde6", width: 8 }];
    case "lake":
      return [
        { d: area(), fill: "#5b9bd5", stroke: "#3f7fb8", width: 3 },
        {
          d: area(shrink(points, 0.86)),
          stroke: "#8cc0e8",
          width: 4,
          opacity: 0.6,
        },
      ];
    case "reef":
      return [
        {
          d: area(),
          fill: "#8fc4c9",
          stroke: "#b8dde0",
          width: 4,
          opacity: 0.9,
        },
        { d: area(), fill: PATTERN("reef") },
      ];
    // ground
    case "land":
      return [{ d: area(), fill: "#9cb56e", stroke: "#d8c690", width: 16 }];
    case "sand":
      return [
        { d: area(), fill: "#e3d29b", stroke: "#cdbb83", width: 2 },
        { d: area(), fill: PATTERN("sand") },
      ];
    case "field":
      return [
        { d: area(), fill: "#c5c27a", stroke: "#a9a55e", width: 2 },
        { d: area(), fill: PATTERN("field") },
      ];
    case "scrub":
      return [{ d: area(), fill: "#9fae6a", stroke: "#889759", width: 2 }];
    case "marsh":
      return [{ d: area(), fill: "#7d9b7a", stroke: "#66845f", width: 2 }];
    case "snow":
      return [
        { d: area(), fill: "#eef3f6", stroke: "#c9d6df", width: 3 },
        { d: area(), fill: PATTERN("snow") },
      ];
    // high ground
    case "rocks":
      return [{ d: area(), fill: "#a7a59a", stroke: "#8a887d", width: 2 }];
    case "hill":
      return [
        { d: area(), fill: "#b9b27a", stroke: "#9d955f", width: 2 },
        { d: area(shrink(points, 0.68)), fill: "#c9bf86" },
        { d: area(shrink(points, 0.38)), fill: "#d8cc96" },
      ];
    case "mountain":
      return [
        { d: area(), fill: "#a39a86", stroke: "#7c7362", width: 3 },
        { d: area(shrink(points, 0.6)), fill: "#b3aa96" },
      ];
    // woods and settlements
    case "forest":
      return [{ d: area(), fill: "#5f8a3c", stroke: "#4a7030", width: 3 }];
    case "pines":
      return [{ d: area(), fill: "#4f7a3a", stroke: "#3d6230", width: 3 }];
    case "orchard":
      return [{ d: area(), fill: "#a4b86c", stroke: "#86994f", width: 2 }];
    case "town":
    case "walled":
      return [{ d: area(), fill: "#cbbf9f", stroke: "#9e8c70", width: 3 }];
    default:
      return [];
  }
}

// The widths of the water in rivers and streams: the bank, and the water inside it
export const RIVER_WIDTH: Partial<Record<TerrainKind, [number, number]>> = {
  river: [24, 14],
  stream: [10, 4],
};

// How wide each line kind is drawn, for lanes cut through woods and gaps in walls
export const LINE_WIDTH: Partial<Record<TerrainKind, number>> = {
  river: 24,
  stream: 10,
  ditch: 9,
  road: 14,
  bridge: 24,
  ridge: 46,
  cliff: 18,
  wall: 11,
  palisade: 9,
};

// How a river ends: narrowing to a trickle (its source), widening into the water it runs into
// (its mouth), or plain and round
export type RiverEnd = "taper" | "flare" | "round";

// One stretch of a line kind to draw, as a run of short straight steps, and how a river ends
// at each end of it
export interface LineRun {
  run: PathPoint[];
  start?: RiverEnd;
  end?: RiverEnd;
}

// A river or stream's water along a run: a band whose width changes towards a source or a
// mouth, with round ends where neither
function riverBand(
  { run, start = "round", end = "round" }: LineRun,
  width: number
): string {
  const length = runLength(run);
  const both = start !== "round" && end !== "round";
  const taper = Math.max(1, Math.min(width * 5, length / (both ? 2 : 1.2)));
  const flare = Math.max(1, Math.min(width * 2.5, length / (both ? 2 : 1.5)));
  const at = (along: number) => {
    let f = 1;
    const ends: [RiverEnd, number][] = [
      [start, along],
      [end, length - along],
    ];
    for (const [kind, from] of ends) {
      if (kind === "taper")
        f = Math.min(f, 0.12 + 0.88 * Math.min(1, Math.max(0, from / taper)));
      if (kind === "flare" && from < flare) {
        const t = 1 - from / flare;
        f *= 1 + 0.6 * t * t;
      }
    }
    return width * f;
  };
  let d = ribbon(run, at);
  const first = run[0];
  const last = run[run.length - 1];
  if (start === "round") d += circlePath(first.x, first.y, width / 2);
  if (end === "round") d += circlePath(last.x, last.y, width / 2);
  return d;
}

// How a line kind looks along some runs, bottom to top
export function lineStrokes(
  kind: TerrainKind,
  runs: LineRun[]
): TerrainStroke[] {
  const all = runs.filter((r) => r.run.length >= 2);
  if (all.length === 0) return [];
  const d = all.map((r) => polylinePath(r.run)).join("");
  const each = (draw: (run: PathPoint[]) => string) =>
    all.map((r) => draw(r.run)).join("");
  switch (kind) {
    case "river":
    case "stream": {
      const [bank, water] = RIVER_WIDTH[kind]!;
      const colours =
        kind === "river" ? ["#3f7fb8", "#6fa6db"] : ["#4f8cc6", "#7fb2e0"];
      const shaped = all.some(
        (r) =>
          (r.start ?? "round") !== "round" || (r.end ?? "round") !== "round"
      );
      if (!shaped)
        return [
          { d, stroke: colours[0], width: bank },
          { d, stroke: colours[1], width: water },
        ];
      return [
        { d: all.map((r) => riverBand(r, bank)).join(""), fill: colours[0] },
        { d: all.map((r) => riverBand(r, water)).join(""), fill: colours[1] },
      ];
    }
    case "ditch":
      return [
        { d, stroke: "#6b5a3e", width: 9 },
        { d, stroke: "#4c3f2b", width: 3 },
      ];
    case "road":
      return [
        { d, stroke: "#8a7650", width: 14 },
        { d, stroke: "#cdb88f", width: 10 },
      ];
    case "bridge":
      return [
        { d, stroke: "#5a4026", width: 24, cap: "butt" },
        { d, stroke: "#a0784a", width: 18, cap: "butt" },
        {
          d: each((r) => ticks(r, 6, 18, 0)),
          stroke: "#7d5a35",
          width: 1.5,
          cap: "butt",
        },
      ];
    // A long, narrow hill, shaded like a hill rising to its crest
    case "ridge":
      return [
        { d, stroke: "#b9b27a", width: 46 },
        { d, stroke: "#c9bf86", width: 28 },
        { d, stroke: "#d8cc96", width: 10 },
      ];
    // A rock face: a dark edge with rocky teeth hanging down the drop, on the right of the
    // direction drawn
    case "cliff":
      return [
        { d: each((r) => teeth(r, 11, 10, 18)), fill: "#7a705f" },
        { d: each((r) => teeth(r, 11, 6, 11)), fill: "#958a76" },
        { d, stroke: "#4a4338", width: 5 },
      ];
    case "wall":
      return [
        { d, stroke: "#6f6a5f", width: 11, cap: "butt" },
        { d, stroke: "#b5afa3", width: 7, dash: "9 3", cap: "butt" },
      ];
    // A fence of wooden stakes: a rail with the stakes' round tops along it
    case "palisade":
      return [
        { d, stroke: "#4f3620", width: 6 },
        {
          d: each((r) => dots(r, 9, 4.5)),
          fill: "#9a6c3c",
          stroke: "#4f3620",
          width: 1.5,
        },
      ];
    default:
      return [];
  }
}

// ---- Scattered items: trees, peaks, rocks, houses ----

// Whether a point is inside a closed outline of short straight steps
export function inPolygon(p: PathPoint, poly: PathPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

// The edge of a circle, as eight points, to check a whole item fits somewhere
export const ringPoints = (x: number, y: number, r: number): PathPoint[] =>
  Array.from({ length: 8 }, (_, i) => ({
    x: x + Math.cos((i * Math.PI) / 4) * r,
    y: y + Math.sin((i * Math.PI) / 4) * r,
  }));

// Where an area's items may go. Each item is a circle of radius r around its middle, and is
// drawn whole or not at all.
export interface ScatterContext {
  fits?: (x: number, y: number, r: number) => boolean; // the whole item is inside the area
  owns?: (x: number, y: number) => boolean; // this feature, not an overlapping one, draws it
  blocked?: (x: number, y: number, r: number) => boolean; // a road, river or wall is in the way
  snowy?: (x: number, y: number) => boolean; // under snow
  height?: (x: number, y: number) => number; // how high the ground is: 0 flat, 1 a hilltop
  placed?: (x: number, y: number, r: number) => void; // told of each item as it's placed
}

// A random number source that's always the same for one spot of one kind, so a forest looks
// the same every time it's drawn, keeps its trees as it's reshaped, and overlapping forests
// agree on where their trees are
function cellRandom(kind: string, ix: number, iy: number): () => number {
  let h = 2166136261;
  const key = `${kind}:${ix}:${iy}`;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(list: T[], r: number) =>
  list[Math.min(list.length - 1, Math.floor(r * list.length))];
const pt = (x: number, y: number) => `${round(x)} ${round(y)}`;

// One item: how big it is (for fitting), its pieces, each in one of the kind's styles, and how
// high the ground is under it (higher items are drawn over lower ones)
export interface Item {
  r: number;
  parts: { style: string; d: string }[];
  level?: number;
  outline?: PathPoint[]; // a building's corners: buildings never overlap each other
}

// What an item is made for: under snow, and how much bigger it's drawn for standing higher
// (closer to the camera)
export interface ItemOptions {
  snowy: boolean;
  scale: number;
}

interface ScatterKind {
  cell: number; // about how far apart items are
  jitter: number; // how far from the grid they wander, as a share of the cell
  chance: number; // how many of the cells get an item
  stagger?: boolean; // every other row shifted by half a cell
  styles: Record<string, Omit<TerrainStroke, "d">>;
  order: string[]; // the styles, bottom to top
  make: (x: number, y: number, rand: () => number, o: ItemOptions) => Item;
}

// Snow lying on things: on tree crowns, roofs and rocks
const SNOW_STYLE = { fill: "#f4f7f9", opacity: 0.9 };

// A round crown of leaves, with snow on its top when under snow
function crown(
  x: number,
  y: number,
  r: number,
  style: string,
  snowy: boolean
): Item {
  const parts = [{ style, d: circlePath(x, y, r) }];
  if (snowy)
    parts.push({
      style: "snow",
      d: circlePath(x - r * 0.22, y - r * 0.28, r * 0.58),
    });
  return { r, parts };
}

// Roofs lit from the top left: each has a lit half and a shaded half either side of its ridge
const ROOF_LIT = ["#b8704f", "#ac6650", "#bb7655", "#a45f47"];
const ROOF_DARK = ["#8a4c37", "#7f4734", "#905239", "#76432f"];
const ROOF_STYLES: Record<string, Omit<TerrainStroke, "d">> = {
  yard: { fill: "#b8ab88", opacity: 0.7 },
  yardSnow: { fill: "#e9eef1" },
  ...Object.fromEntries(ROOF_LIT.map((fill, i) => [`r${i}`, { fill }])),
  ...Object.fromEntries(ROOF_DARK.map((fill, i) => [`r${i}s`, { fill }])),
  snow: { fill: "#f3f6f8" },
  snowS: { fill: "#d3dbe0" },
  stone: { fill: "#9a958b" },
  stoneS: { fill: "#7c776e" },
  edge: { stroke: "#5e3d2b", width: 1.1 },
  stoneEdge: { stroke: "#4f4a42", width: 1.3 },
  snowEdge: { stroke: "#8d8a86", width: 1.1 },
  chimney: { fill: "#6b5a4a" },
  tower: { fill: "#a39d92", stroke: "#4f4a42", width: 1.3 },
  towerRoof: { stroke: "#4f4a42", width: 1 },
};
const ROOF_ORDER = [
  "yard",
  "yardSnow",
  "r0",
  "r1",
  "r2",
  "r3",
  "r0s",
  "r1s",
  "r2s",
  "r3s",
  "stone",
  "stoneS",
  "snow",
  "snowS",
  "edge",
  "stoneEdge",
  "snowEdge",
  "chimney",
  "tower",
  "towerRoof",
];

const SCATTER: Record<string, ScatterKind> = {
  forest: {
    cell: 17,
    jitter: 0.9,
    chance: 0.95,
    styles: {
      a: { fill: "#3f6b25", stroke: "#34591f", width: 1.4 },
      b: { fill: "#46742a", stroke: "#34591f", width: 1.4 },
      c: { fill: "#386021", stroke: "#2f521b", width: 1.4 },
      snow: SNOW_STYLE,
    },
    order: ["a", "b", "c", "snow"],
    make: (x, y, rand, o) =>
      crown(
        x,
        y,
        (7.5 + rand() * 4) * o.scale,
        pick(["a", "b", "c"], rand()),
        o.snowy
      ),
  },
  pines: {
    cell: 15,
    jitter: 0.8,
    chance: 0.92,
    styles: {
      trunk: { stroke: "#5a4026", width: 2, cap: "butt" },
      a: { fill: "#2f5a26", stroke: "#264a1f", width: 1 },
      b: { fill: "#356428", stroke: "#264a1f", width: 1 },
      snow: SNOW_STYLE,
    },
    order: ["trunk", "a", "b", "snow"],
    make: (x, y, rand, o) => {
      const s = (0.8 + rand() * 0.45) * o.scale;
      const h = 17 * s;
      const w = 13 * s;
      const top = y - h * 0.6;
      const parts = [
        { style: "trunk", d: `M${pt(x, y + h * 0.35)}v${round(h * 0.2)}` },
        {
          style: pick(["a", "b"], rand()),
          d: `M${pt(x, top)}L${pt(x + w / 2, y + h * 0.4)}L${pt(x - w / 2, y + h * 0.4)}Z`,
        },
      ];
      // snow down the top half of the tree, with a ragged edge
      if (o.snowy)
        parts.push({
          style: "snow",
          d:
            `M${pt(x, top)}L${pt(x + w * 0.27, top + h * 0.5)}L${pt(x + w * 0.1, top + h * 0.44)}` +
            `L${pt(x, top + h * 0.52)}L${pt(x - w * 0.12, top + h * 0.45)}L${pt(x - w * 0.27, top + h * 0.5)}Z`,
        });
      return { r: h * 0.6, parts };
    },
  },
  orchard: {
    cell: 26,
    jitter: 0.06,
    chance: 1,
    styles: {
      a: { fill: "#577a33", stroke: "#466528", width: 1.5 },
      b: { fill: "#5e8338", stroke: "#466528", width: 1.5 },
      snow: SNOW_STYLE,
    },
    order: ["a", "b", "snow"],
    make: (x, y, rand, o) =>
      crown(
        x,
        y,
        (6 + rand() * 1.6) * o.scale,
        pick(["a", "b"], rand()),
        o.snowy
      ),
  },
  scrub: {
    cell: 19,
    jitter: 0.8,
    chance: 0.75,
    styles: {
      a: { fill: "#6f8a45" },
      b: { fill: "#677f40" },
      snow: SNOW_STYLE,
    },
    order: ["a", "b", "snow"],
    make: (x, y, rand, o) => {
      const style = pick(["a", "b"], rand());
      const count = 2 + Math.floor(rand() * 2);
      let d = "";
      let snow = "";
      for (let i = 0; i < count; i++) {
        const bx = x + (rand() - 0.5) * 7 * o.scale;
        const by = y + (rand() - 0.5) * 6 * o.scale;
        const br = (2.8 + rand() * 1.5) * o.scale;
        d += circlePath(bx, by, br);
        if (o.snowy)
          snow += circlePath(bx - br * 0.2, by - br * 0.25, br * 0.55);
      }
      const parts = [{ style, d }];
      if (snow) parts.push({ style: "snow", d: snow });
      return { r: 8 * o.scale, parts };
    },
  },
  rocks: {
    cell: 17,
    jitter: 0.8,
    chance: 0.7,
    styles: {
      a: { fill: "#8b897e", stroke: "#6f6d63", width: 1 },
      b: { fill: "#98958a", stroke: "#6f6d63", width: 1 },
      snow: SNOW_STYLE,
    },
    order: ["a", "b", "snow"],
    make: (x, y, rand, o) => {
      const sides = 5 + Math.floor(rand() * 2);
      const size = (4 + rand() * 3.5) * o.scale;
      let d = "";
      for (let i = 0; i < sides; i++) {
        const a = ((i + rand() * 0.5) / sides) * Math.PI * 2;
        const r = size * (0.7 + rand() * 0.3);
        d += `${i === 0 ? "M" : "L"}${pt(x + Math.cos(a) * r, y + Math.sin(a) * r)}`;
      }
      const parts = [{ style: pick(["a", "b"], rand()), d: `${d}Z` }];
      if (o.snowy)
        parts.push({
          style: "snow",
          d: circlePath(x - size * 0.15, y - size * 0.3, size * 0.45),
        });
      return { r: size, parts };
    },
  },
  mountain: {
    cell: 32,
    jitter: 0.45,
    chance: 0.9,
    stagger: true,
    styles: {
      a: { fill: "#8f8674", stroke: "#6a6252", width: 1.4 },
      b: { fill: "#968d7a", stroke: "#6a6252", width: 1.4 },
      c: { fill: "#8a8170", stroke: "#6a6252", width: 1.4 },
      shade: { fill: "#000", opacity: 0.13 },
      cap: { fill: "#f3f1ea", stroke: "#d9dcdc", width: 0.8 },
    },
    order: ["a", "b", "c", "shade", "cap"],
    make: (x, y, rand, o) => {
      const s = 0.8 + rand() * 0.45;
      const w = 27 * s;
      const h = 23 * s;
      const top = y - h / 2;
      const foot = y + h / 2;
      // the snow line: a little way down, or most of the way under snow
      const c = o.snowy ? 0.55 : 0.28 + rand() * 0.08;
      const capY = top + h * c;
      const capX = (w / 2) * c;
      return {
        r: Math.max(w, h) / 2,
        parts: [
          {
            style: pick(["a", "b", "c"], rand()),
            d: `M${pt(x - w / 2, foot)}L${pt(x, top)}L${pt(x + w / 2, foot)}Z`,
          },
          // the side away from the light
          {
            style: "shade",
            d: `M${pt(x, top)}L${pt(x + w / 2, foot)}L${pt(x + w * 0.08, foot)}Z`,
          },
          {
            style: "cap",
            d:
              `M${pt(x, top)}L${pt(x + capX, capY)}L${pt(x + capX / 2, capY - 2)}` +
              `L${pt(x, capY)}L${pt(x - capX / 2, capY - 2)}L${pt(x - capX, capY)}Z`,
          },
        ],
      };
    },
  },
  marsh: {
    cell: 20,
    jitter: 0.8,
    chance: 0.8,
    styles: { a: { stroke: "#5f7f66", width: 1.8 } },
    order: ["a"],
    make: (x, y, rand, o) => {
      const s = (0.8 + rand() * 0.4) * o.scale;
      return {
        r: 7 * s,
        parts: [
          {
            style: "a",
            d:
              `M${pt(x - 6 * s, y)}h${round(12 * s)}` +
              `M${pt(x, y)}l${round(-3 * s)} ${round(-6 * s)}` +
              `M${pt(x, y)}v${round(-7 * s)}` +
              `M${pt(x, y)}l${round(3 * s)} ${round(-6 * s)}`,
          },
        ],
      };
    },
  },
  town: {
    cell: 21,
    jitter: 0.35,
    chance: 0.9,
    styles: ROOF_STYLES,
    order: ROOF_ORDER,
    make: (x, y, rand, o) =>
      house(
        x,
        y,
        (11 + rand() * 6) * o.scale,
        (8 + rand() * 4) * o.scale,
        (rand() - 0.5) * 0.35,
        rand(),
        o.snowy,
        rand() < 0.6
      ),
  },
  // Old-town blocks: buildings round a courtyard, closed or open on a side or two
  courtyard: {
    cell: 72,
    jitter: 0.5,
    chance: 0.35,
    styles: ROOF_STYLES,
    order: ROOF_ORDER,
    make: (x, y, rand, o) =>
      courtyard(
        x,
        y,
        36 + rand() * 12,
        32 + rand() * 12,
        (rand() - 0.5) * 0.3,
        rand(),
        o.snowy
      ),
  },
};
SCATTER.walled = SCATTER.town;

// ---- Buildings ----

// The corners of a rectangle turned by `angle` about (x, y), `long` along the angle and `deep`
// across it
export function rectCorners(
  x: number,
  y: number,
  long: number,
  deep: number,
  angle: number
): PathPoint[] {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const l = long / 2;
  const w = deep / 2;
  return [
    [-l, -w],
    [l, -w],
    [l, w],
    [-l, w],
  ].map(([a, b]) => ({ x: x + dx * a - dy * b, y: y + dy * a + dx * b }));
}

// Whether two outlines (convex, as corners) overlap by more than a hair: ones that only touch,
// like terrace houses side by side, don't count
export function rectsOverlap(a: PathPoint[], b: PathPoint[]): boolean {
  for (const poly of [a, b])
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
      const ax = -(q.y - p.y) / length;
      const ay = (q.x - p.x) / length;
      const pa = a.map((v) => v.x * ax + v.y * ay);
      const pb = b.map((v) => v.x * ax + v.y * ay);
      const depth =
        Math.min(Math.max(...pa), Math.max(...pb)) -
        Math.max(Math.min(...pa), Math.min(...pb));
      if (depth < 0.4) return false;
    }
  return true;
}

// A rectangle turned by `angle` about (x, y), `long` along the angle and `short` across it,
// as SVG path data; a and b shift it along and across
function box(
  x: number,
  y: number,
  long: number,
  short: number,
  angle: number,
  a0 = 0,
  b0 = 0
): string {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const corner = (a: number, b: number) =>
    pt(x + dx * (a + a0) - dy * (b + b0), y + dy * (a + a0) + dx * (b + b0));
  const l = long / 2;
  const s = short / 2;
  return `M${corner(-l, -s)}L${corner(l, -s)}L${corner(l, s)}L${corner(-l, s)}Z`;
}

// A house: a roof seen from above, turned by `angle`, its ridge along `long`: the half facing
// the light is lighter. White under snow, and maybe with a chimney.
export function house(
  x: number,
  y: number,
  long: number,
  short: number,
  angle: number,
  shade: number,
  snowy = false,
  chimney = false,
  material: "tile" | "stone" = "tile"
): Item {
  const n = { x: -Math.sin(angle), y: Math.cos(angle) };
  // which side of the ridge faces the light (the top left)
  const litSide = n.x + n.y < 0 ? 1 : -1;
  const i = Math.min(3, Math.floor(shade * 4));
  const lit = snowy ? "snow" : material === "stone" ? "stone" : `r${i}`;
  const dark = snowy ? "snowS" : material === "stone" ? "stoneS" : `r${i}s`;
  const parts = [
    {
      style: lit,
      d: box(x, y, long, short / 2, angle, 0, (litSide * short) / 4),
    },
    {
      style: dark,
      d: box(x, y, long, short / 2, angle, 0, (-litSide * short) / 4),
    },
    {
      style: snowy ? "snowEdge" : material === "stone" ? "stoneEdge" : "edge",
      d: box(x, y, long, short, angle),
    },
  ];
  if (chimney && !snowy)
    parts.push({
      style: "chimney",
      d: box(x, y, 3, 3, angle, long * 0.22, (litSide * short) / 4),
    });
  return {
    r: Math.hypot(long / 2, short / 2),
    parts,
    outline: rectCorners(x, y, long, short, angle),
  };
}

// An old-town block: wings of houses round a courtyard, closed, or open on one or two sides
export function courtyard(
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  shape: number,
  snowy = false
): Item {
  const t = 9; // how deep each wing is
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const at = (a: number, b: number) => ({
    x: x + dx * a - dy * b,
    y: y + dy * a + dx * b,
  });
  // the wings: along the top and bottom (turned with the block), down the sides (turned a
  // quarter more)
  const top = { c: at(0, -h / 2 + t / 2), long: w, angle };
  const bottom = { c: at(0, h / 2 - t / 2), long: w, angle };
  const left = {
    c: at(-w / 2 + t / 2, 0),
    long: h - 2 * t,
    angle: angle + Math.PI / 2,
  };
  const right = {
    c: at(w / 2 - t / 2, 0),
    long: h - 2 * t,
    angle: angle + Math.PI / 2,
  };
  const wings =
    shape < 0.35
      ? [top, bottom, left, right]
      : shape < 0.7
        ? [top, left, right]
        : [top, left];
  const parts: Item["parts"] = [
    {
      style: snowy ? "yardSnow" : "yard",
      d: box(x, y, w - 2 * t, h - 2 * t, angle),
    },
  ];
  wings.forEach((wing, k) =>
    parts.push(
      ...house(
        wing.c.x,
        wing.c.y,
        wing.long,
        t,
        wing.angle,
        ((k * 3 + shape * 10) % 4) / 4,
        snowy
      ).parts
    )
  );
  return {
    r: Math.hypot(w / 2, h / 2),
    parts,
    outline: rectCorners(x, y, w, h, angle),
  };
}

// A church: a cross of nave and transepts in stone, with a square tower at the west end
export function church(
  x: number,
  y: number,
  angle: number,
  snowy: boolean
): Item {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nave = house(x, y, 44, 15, angle, 0, snowy, false, "stone");
  const transept = house(
    x + dx * 7,
    y + dy * 7,
    36,
    13,
    angle + Math.PI / 2,
    0,
    snowy,
    false,
    "stone"
  );
  const tx = x - dx * 26;
  const ty = y - dy * 26;
  const tower = box(tx, ty, 14, 14, angle);
  const c = (a: number, b: number) =>
    pt(tx + dx * a - dy * b, ty + dy * a + dx * b);
  return {
    r: 33,
    parts: [
      ...nave.parts,
      ...transept.parts,
      { style: "tower", d: tower },
      {
        style: "towerRoof",
        d: `M${c(-7, -7)}L${c(7, 7)}M${c(7, -7)}L${c(-7, 7)}`,
      },
    ],
  };
}

// How many steps of height items are sorted into, so higher ones are drawn over lower ones
const LEVELS = 6;

// Pieces of items, merged into one stroke per style and height, bottom to top: everything on
// low ground first, then each step higher. `key` is the kind of item (a terrain kind, or
// "courtyard").
export function itemStrokes(key: string, items: Item[]): TerrainStroke[] {
  const spec = SCATTER[key];
  if (!spec) return [];
  const out: TerrainStroke[] = [];
  for (let level = 0; level < LEVELS; level++) {
    const here = items.filter((item) => (item.level ?? 0) === level);
    if (here.length === 0) continue;
    for (const style of spec.order) {
      const d = here
        .map((item) =>
          item.parts
            .filter((p) => p.style === style)
            .map((p) => p.d)
            .join("")
        )
        .join("");
      if (d) out.push({ ...spec.styles[style], d });
    }
  }
  return out;
}

// The trees, peaks, rocks or houses over an area: one to a spot on a loose grid, a little
// different in size and colour each, and only where the whole item fits. On high ground they're
// a little bigger (nearer the camera) and drawn over the ones below. `key` picks another kind
// of item to scatter (old-town courtyards over a town).
export function scatterItems(
  feature: TerrainFeature,
  ctx: ScatterContext = {},
  key: string = feature.kind
): TerrainStroke[] {
  const spec = SCATTER[key];
  if (!spec || feature.points.length < 3) return [];
  const poly = sampleCurve(feature.points, true, 8);
  const holes = (feature.holes ?? []).map((hole) => sampleCurve(hole, true, 8));
  const inShape = (p: PathPoint) =>
    inPolygon(p, poly) && !holes.some((h) => inPolygon(p, h));
  const fits =
    ctx.fits ??
    ((x: number, y: number, r: number) =>
      inShape({ x, y }) && ringPoints(x, y, r).every(inShape));
  const x0 = Math.min(...poly.map((p) => p.x));
  const x1 = Math.max(...poly.map((p) => p.x));
  const y0 = Math.min(...poly.map((p) => p.y));
  const y1 = Math.max(...poly.map((p) => p.y));
  const { cell } = spec;
  const items: Item[] = [];
  for (let iy = Math.floor(y0 / cell) - 1; iy <= Math.ceil(y1 / cell) + 1; iy++)
    for (
      let ix = Math.floor(x0 / cell) - 1;
      ix <= Math.ceil(x1 / cell) + 1;
      ix++
    ) {
      const rand = cellRandom(key === "walled" ? "town" : key, ix, iy);
      if (rand() > spec.chance) continue;
      const shift = spec.stagger && iy % 2 !== 0 ? cell / 2 : 0;
      const x = (ix + 0.5) * cell + shift + (rand() - 0.5) * cell * spec.jitter;
      const y = (iy + 0.5) * cell + (rand() - 0.5) * cell * spec.jitter;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const height = Math.max(0, ctx.height?.(x, y) ?? 0);
      const item = spec.make(x, y, rand, {
        snowy: !!ctx.snowy?.(x, y),
        scale: 1 + 0.22 * Math.min(height, 1.5),
      });
      if (!fits(x, y, item.r)) continue;
      if (ctx.owns && !ctx.owns(x, y)) continue;
      if (ctx.blocked?.(x, y, item.r)) continue;
      // no building on top of another
      const outline = item.outline;
      if (
        outline &&
        items.some(
          (o) =>
            o.outline &&
            Math.hypot(
              o.outline[0].x - outline[0].x,
              o.outline[0].y - outline[0].y
            ) <
              2 * (o.r + item.r) &&
            rectsOverlap(o.outline, outline)
        )
      )
        continue;
      item.level = Math.min(LEVELS - 1, Math.floor(height * 3));
      items.push(item);
      ctx.placed?.(x, y, item.r);
    }
  return itemStrokes(key, items);
}

const LAYER: Record<TerrainKind, number> = Object.fromEntries(
  TERRAIN_KINDS.map((k, i) => [k.kind, i])
) as Record<TerrainKind, number>;

// The features in the order they're drawn: by kind (see TERRAIN_KINDS), and within a kind in
// the order they were drawn
export function sortedFeatures(features: TerrainFeature[]): TerrainFeature[] {
  return features
    .map((feature, index) => ({ feature, index }))
    .sort(
      (a, b) =>
        LAYER[a.feature.kind] - LAYER[b.feature.kind] || a.index - b.index
    )
    .map(({ feature }) => feature);
}

// The patterns some kinds are filled with, as SVG, to go in the <defs> of whatever draws the
// terrain (the editor's layer, and the renderer's picture of the battleground)
export const TERRAIN_PATTERNS = [
  // Hill shading: lit from the top left, in shadow to the bottom right, across each shape
  `<linearGradient id="tp-shade" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#fff" stop-opacity="0.55"/>` +
    `<stop offset="0.5" stop-color="#fff" stop-opacity="0"/>` +
    `<stop offset="0.5" stop-color="#000" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="0.5"/></linearGradient>`,
  // Ice: faint cracks over frozen water
  `<pattern id="tp-ice" width="90" height="70" patternUnits="userSpaceOnUse">` +
    `<path d="M4 20l22 6 14-10 18 8M40 16l6 22-10 18M58 24l24 4M20 52l18 4 22-6 26 8" ` +
    `stroke="#a9c8d8" stroke-width="1.2" fill="none" stroke-linecap="round"/></pattern>`,
  `<pattern id="tp-field" width="18" height="18" patternUnits="userSpaceOnUse">` +
    `<path d="M0 18L18 0M-4 4L4 -4M14 22L22 14" stroke="#a9a55e" stroke-width="2"/></pattern>`,
  `<pattern id="tp-sand" width="22" height="22" patternUnits="userSpaceOnUse">` +
    `<g fill="#c8b47a"><circle cx="4" cy="5" r="1.4"/><circle cx="15" cy="9" r="1.2"/>` +
    `<circle cx="9" cy="17" r="1.3"/><circle cx="19" cy="19" r="1"/></g></pattern>`,
  `<pattern id="tp-snow" width="36" height="28" patternUnits="userSpaceOnUse">` +
    `<path d="M4 8q6 -4 12 0M20 20q6 -4 12 0" stroke="#c3d3de" stroke-width="2" fill="none" stroke-linecap="round"/></pattern>`,
  `<pattern id="tp-waves" width="48" height="30" patternUnits="userSpaceOnUse">` +
    `<path d="M4 10q5 -5 10 0t10 0M26 24q5 -5 10 0t10 0" stroke="#5f8bb5" stroke-width="2" fill="none" stroke-linecap="round"/></pattern>`,
  `<pattern id="tp-reef" width="30" height="26" patternUnits="userSpaceOnUse">` +
    `<g fill="#5f7d7a"><circle cx="6" cy="6" r="2.5"/><circle cx="10" cy="9" r="1.8"/>` +
    `<circle cx="21" cy="18" r="2.6"/><circle cx="25" cy="15" r="1.6"/></g></pattern>`,
].join("");

// A fill as SVG: a colour, or a pattern from TERRAIN_PATTERNS
export const svgFill = (fill: string | undefined) =>
  !fill
    ? "none"
    : fill.startsWith("pattern:")
      ? `url(#tp-${fill.slice(8)})`
      : fill;

const escape = (value: string) => value.replace(/"/g, "&quot;");

// The strokes as SVG elements. A stroke drawn inside a shape gets a clip path, named from
// `prefix` so that two drawings on one page don't share names.
export function strokesSvg(strokes: TerrainStroke[], prefix = "tc"): string {
  return strokes
    .map((s, i) => {
      const path =
        `<path d="${escape(s.d)}" fill="${svgFill(s.fill)}"` +
        (s.fillRule ? ` fill-rule="${s.fillRule}"` : "") +
        (s.stroke
          ? ` stroke="${s.stroke}" stroke-width="${s.width ?? 1}" stroke-linecap="${s.cap ?? "round"}" stroke-linejoin="round"`
          : "") +
        (s.dash ? ` stroke-dasharray="${s.dash}"` : "") +
        (s.opacity !== undefined ? ` opacity="${s.opacity}"` : "") +
        `/>`;
      if (!s.clip) return path;
      const id = `${prefix}${i}`;
      const shapes = (Array.isArray(s.clip) ? s.clip : [s.clip])
        .map(
          (d) =>
            `<path d="${escape(d)}"${s.clipRule ? ` clip-rule="${s.clipRule}"` : ""}/>`
        )
        .join("");
      return (
        `<clipPath id="${id}">${shapes}</clipPath>` +
        `<g clip-path="url(#${id})">${path}</g>`
      );
    })
    .join("");
}

// The names of a battle's features in the list: their own name, or "Hill 1", "Hill 2", ... in
// the order they were drawn
export function featureLabels(features: TerrainFeature[]): Map<string, string> {
  const labels = new Map<string, string>();
  const counts = new Map<TerrainKind, number>();
  for (const f of features) {
    const n = (counts.get(f.kind) ?? 0) + 1;
    counts.set(f.kind, n);
    labels.set(f.id, f.name?.trim() || `${kindInfo(f.kind).label} ${n}`);
  }
  return labels;
}

// ---- Thumbnails ----

// The size of a kind's thumbnail picture, in its own units
export const THUMB_WIDTH = 320;
export const THUMB_HEIGHT = 124;

// What a kind's thumbnail shows: the ground it usually sits on, and an example of it (with a
// river under a bridge, so it's clear what it's for)
export function thumbnailFor(kind: TerrainKind): {
  ground: BattleKind;
  features: TerrainFeature[];
} {
  const info = kindInfo(kind);
  const onSea =
    info.group === "Water"
      ? kind !== "lake"
      : kind === "land" || kind === "sand";
  const blob: PathPoint[] = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const wobble = 1 + Math.sin(i * 2.1) * 0.12;
    return {
      x: THUMB_WIDTH / 2 + Math.cos(a) * 125 * wobble,
      y: THUMB_HEIGHT / 2 + Math.sin(a) * 46 * wobble,
    };
  });
  const curve: PathPoint[] = [
    { x: 20, y: 98 },
    { x: 110, y: 34 },
    { x: 210, y: 90 },
    // rivers and streams flow on off the picture, from a source on the left
    kind === "river" || kind === "stream"
      ? { x: 330, y: 22 }
      : { x: 300, y: 28 },
  ];
  const features: TerrainFeature[] =
    kind === "bridge"
      ? [
          {
            id: "thumb-bridge-river",
            kind: "river",
            points: [
              { x: 165, y: 0 },
              { x: 150, y: 62 },
              { x: 168, y: 124 },
            ],
          },
          {
            id: "thumb-bridge",
            kind,
            points: [
              { x: 110, y: 62 },
              { x: 200, y: 62 },
            ],
          },
        ]
      : [
          {
            id: `thumb-${kind}`,
            kind,
            points: info.shape === "line" ? curve : blob,
          },
        ];
  return { ground: onSea ? "sea" : "land", features };
}

// ---- Reading saved terrain ----

const KINDS = new Set(TERRAIN_KINDS.map((k) => k.kind));

// Only the points that are pairs of numbers
const readPoints = (raw: unknown): PathPoint[] =>
  Array.isArray(raw)
    ? raw
        .filter((p: any) => p && Number.isFinite(p.x) && Number.isFinite(p.y))
        .map((p: any) => ({ x: p.x, y: p.y }))
    : [];

export function parseTerrain(raw: unknown): TerrainFeature[] {
  if (!Array.isArray(raw)) return [];
  const features: TerrainFeature[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry.id !== "string" || !KINDS.has(entry.kind))
      continue;
    const points = readPoints(entry.points);
    if (points.length < minPoints(entry.kind)) continue;
    const feature: TerrainFeature = { id: entry.id, kind: entry.kind, points };
    if (typeof entry.name === "string" && entry.name.trim())
      feature.name = entry.name.trim();
    // only areas have holes, and a hole needs three points
    const holes =
      Array.isArray(entry.holes) && !isLine(entry.kind)
        ? entry.holes
            .map(readPoints)
            .filter((hole: PathPoint[]) => hole.length >= 3)
        : [];
    if (holes.length > 0) feature.holes = holes;
    features.push(feature);
  }
  return features;
}
