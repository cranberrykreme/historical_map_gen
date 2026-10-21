// Battle drawing: the shared geometry (areas, edges, crossings and a grid for fast
// distance checks) and the sizes the stages use.

import {
  BattleKind,
  PathPoint,
  TerrainFeature,
  TerrainKind,
} from "../../types";
import {
  TerrainStroke,
  holesPath,
  inPolygon,
  polylinePath,
  sampleCurve,
  smoothPath,
} from "./terrain";

export type P = PathPoint;

export const WATER_KINDS = new Set<TerrainKind>([
  "deep",
  "shallows",
  "lake",
  "reef",
]);
export const WOOD_KINDS = new Set<TerrainKind>(["forest", "pines", "orchard"]);
export const TOWN_KINDS = new Set<TerrainKind>(["town", "walled"]);
export const LANE_LINES = new Set<TerrainKind>(["road", "river", "stream"]);
export const STOPS_AT_WATER = new Set<TerrainKind>([
  "road",
  "wall",
  "palisade",
  "ditch",
  "ridge",
]);
export const BREAKS_AT_RIVERS = new Set<TerrainKind>([
  "wall",
  "palisade",
  "ditch",
]);

// How close to the battle's edge a river's end must be to run off it, rather than start there
export const EDGE = 12;
// A street through a town: how wide it's cleared, how far from the road's middle its row of
// terrace houses stands, how big each house is, and how much room the other buildings leave
// the street
export const STREET = 52;
export const ROW_SET_BACK = 20.5;
export const UNIT_LONG = 10.5;
export const UNIT_DEEP = 13;
export const STREET_ROOM = 40;
// A walled town's wall: how far inside the town's edge it runs, and how much room the houses
// leave it
export const WALL_INSET = 7;
export const WALL_ROOM = 16;

export interface Area {
  feature: TerrainFeature;
  poly: P[]; // the outline as short straight steps
  holes: P[][]; // its holes, the same way
  d: string; // the outline and holes as smooth curves
  rule?: "evenodd"; // how to fill or clip to `d`: even-odd when it has holes
  box: { x0: number; y0: number; x1: number; y1: number };
}

export const boxOf = (poly: P[]) => ({
  x0: Math.min(...poly.map((p) => p.x)),
  y0: Math.min(...poly.map((p) => p.y)),
  x1: Math.max(...poly.map((p) => p.x)),
  y1: Math.max(...poly.map((p) => p.y)),
});

export const makeArea = (feature: TerrainFeature): Area => {
  const poly = sampleCurve(feature.points, true, 8);
  const holes = (feature.holes ?? []).map((hole) => sampleCurve(hole, true, 8));
  return {
    feature,
    poly,
    holes,
    d: smoothPath(feature.points, true) + holesPath(feature),
    rule: holes.length > 0 ? "evenodd" : undefined,
    box: boxOf(poly),
  };
};

// Inside the area's edge, and not in one of its holes
export const inArea = (p: P, area: Area) =>
  p.x >= area.box.x0 &&
  p.x <= area.box.x1 &&
  p.y >= area.box.y0 &&
  p.y <= area.box.y1 &&
  inPolygon(p, area.poly) &&
  !area.holes.some((hole) => inPolygon(p, hole));

// Whether there's water at a point: the topmost area there is water, or there's no area and
// the battle is at sea
export function waterAt(p: P, areas: Area[], ground: BattleKind): boolean {
  for (let i = areas.length - 1; i >= 0; i--)
    if (inArea(p, areas[i])) return WATER_KINDS.has(areas[i].feature.kind);
  return ground === "sea";
}

// The direction out of a closed outline at each of its points (a unit vector)
export function outwardNormals(poly: P[]): P[] {
  let twiceArea = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    twiceArea += a.x * b.y - b.x * a.y;
  }
  const flip = twiceArea > 0 ? -1 : 1;
  return poly.map((_, i) => {
    const a = poly[(i - 1 + poly.length) % poly.length];
    const b = poly[(i + 1) % poly.length];
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return {
      x: (-(b.y - a.y) / length) * flip,
      y: ((b.x - a.x) / length) * flip,
    };
  });
}

// The stretches of a closed outline where `test` holds at each point, with the outward
// direction at each point. A whole outline comes back as one closed stretch. For a hole's
// outline, "outward" is out of the area: into the hole.
export interface Edge {
  run: P[];
  normals: P[];
  closed: boolean;
}
export function edgeRuns(
  poly: P[],
  test: (p: P, outward: P) => boolean,
  hole = false
): Edge[] {
  const normals = outwardNormals(poly).map((n) =>
    hole ? { x: -n.x, y: -n.y } : n
  );
  const flags = poly.map((p, i) => test(p, normals[i]));
  if (flags.every(Boolean)) return [{ run: poly, normals, closed: true }];
  const start = flags.indexOf(false);
  if (start < 0) return [];
  const runs: Edge[] = [];
  let current: Edge | null = null;
  for (let k = 1; k <= poly.length; k++) {
    const i = (start + k) % poly.length;
    if (flags[i]) {
      if (!current) current = { run: [], normals: [], closed: false };
      current.run.push(poly[i]);
      current.normals.push(normals[i]);
    } else if (current) {
      runs.push(current);
      current = null;
    }
  }
  if (current) runs.push(current);
  return runs.filter((r) => r.run.length >= 2);
}

// The stretches of an area's edge and its holes' edges where `test` holds
export const areaEdges = (
  area: Area,
  test: (p: P, outward: P) => boolean
): Edge[] => [
  ...edgeRuns(area.poly, test),
  ...area.holes.flatMap((hole) => edgeRuns(hole, test, true)),
];

// An edge moved out (or in, for a negative distance) along its normals
export const offset = (edge: Edge, distance: number): P[] =>
  edge.run.map((p, i) => ({
    x: p.x + edge.normals[i].x * distance,
    y: p.y + edge.normals[i].y * distance,
  }));

export const edgePath = (edge: Edge, distance = 0) =>
  polylinePath(distance ? offset(edge, distance) : edge.run, edge.closed);

// The stretches of a run where `keep` holds
export function splitRun(
  run: P[],
  keep: (p: P, i: number) => boolean
): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = [];
  let from = -1;
  run.forEach((p, i) => {
    if (keep(p, i)) {
      if (from < 0) from = i;
    } else if (from >= 0) {
      out.push({ from, to: i - 1 });
      from = -1;
    }
  });
  if (from >= 0) out.push({ from, to: run.length - 1 });
  return out;
}

export const nearestDistance = (p: P, run: P[]) => {
  let best = Infinity;
  for (const q of run) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
  return best;
};

// Where two runs cross, with the first run's direction there. The second run is cut into
// short pieces with boxes round them, so most of it is skipped at a glance.
export function crossings(a: P[], b: P[]): { at: P; dir: P }[] {
  const out: { at: P; dir: P }[] = [];
  const pieces: {
    from: number;
    to: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  }[] = [];
  for (let from = 0; from < b.length - 1; from += 16) {
    const to = Math.min(from + 16, b.length - 1);
    const slice = b.slice(from, to + 1);
    pieces.push({ from, to, ...boxOf(slice) });
  }
  for (let i = 1; i < a.length; i++) {
    const p = a[i - 1];
    const r = { x: a[i].x - p.x, y: a[i].y - p.y };
    const sx0 = Math.min(p.x, a[i].x);
    const sx1 = Math.max(p.x, a[i].x);
    const sy0 = Math.min(p.y, a[i].y);
    const sy1 = Math.max(p.y, a[i].y);
    for (const piece of pieces) {
      if (piece.x1 < sx0 || piece.x0 > sx1 || piece.y1 < sy0 || piece.y0 > sy1)
        continue;
      for (let j = piece.from + 1; j <= piece.to; j++) {
        const q = b[j - 1];
        const s = { x: b[j].x - q.x, y: b[j].y - q.y };
        const cross = r.x * s.y - r.y * s.x;
        if (Math.abs(cross) < 1e-9) continue;
        const t = ((q.x - p.x) * s.y - (q.y - p.y) * s.x) / cross;
        const u = ((q.x - p.x) * r.y - (q.y - p.y) * r.x) / cross;
        if (t < 0 || t > 1 || u < 0 || u > 1) continue;
        const at = { x: p.x + r.x * t, y: p.y + r.y * t };
        if (out.some((c) => Math.hypot(c.at.x - at.x, c.at.y - at.y) < 8))
          continue;
        const length = Math.hypot(r.x, r.y) || 1;
        out.push({ at, dir: { x: r.x / length, y: r.y / length } });
      }
    }
  }
  return out;
}

// A river's mouth: its water fanning out into the sea or lake it runs into
export function mouth(
  at: P,
  dir: P,
  width: number,
  colour: string
): TerrainStroke[] {
  const n = { x: -dir.y, y: dir.x };
  const pt = (along: number, across: number) =>
    `${Math.round((at.x + dir.x * along + n.x * across) * 10) / 10} ${Math.round((at.y + dir.y * along + n.y * across) * 10) / 10}`;
  const shape = (length: number, spread: number) =>
    `M${pt(-2, width / 2)}Q${pt(length * 0.5, spread * 0.8)} ${pt(length, spread)}` +
    `Q${pt(length * 1.3, 0)} ${pt(length, -spread)}` +
    `Q${pt(length * 0.5, -spread * 0.8)} ${pt(-2, -width / 2)}Z`;
  // Many faint layers, biggest first, so it fades out into the water without rings
  return [5, 4, 3, 2, 1].map((k) => ({
    d: shape(width * (0.6 + 0.45 * k), width * (0.55 + 0.3 * k)),
    fill: colour,
    opacity: 0.14,
  }));
}

// Strokes from several features of a group, drawn layer by layer across all of them (every
// river's bank, then every river's water) so where they meet they join without a seam
export function interleave(lists: TerrainStroke[][]): TerrainStroke[] {
  const out: TerrainStroke[] = [];
  const most = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < most; i++)
    for (const list of lists) if (list[i]) out.push(list[i]);
  return out;
}

export const unit = (from: P, to: P): P => {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
};

// Whether two areas overlap at all
export function overlaps(a: Area, b: Area): boolean {
  if (
    a.box.x1 < b.box.x0 ||
    b.box.x1 < a.box.x0 ||
    a.box.y1 < b.box.y0 ||
    b.box.y1 < a.box.y0
  )
    return false;
  return a.poly.some((p) => inArea(p, b)) || b.poly.some((p) => inArea(p, a));
}

// Line segments filed by where they are, so "is anything within r of this point?" only looks
// at the segments nearby. Each segment can ask for extra room around it (a road's lane).
export class SegmentGrid {
  private cells = new Map<number, { a: P; b: P; room: number }[]>();
  private maxRoom = 0;
  constructor(private size = 40) {}

  private key = (ix: number, iy: number) => ix * 131072 + iy;

  add(a: P, b: P, room = 0): void {
    this.maxRoom = Math.max(this.maxRoom, room);
    const ix = Math.floor((a.x + b.x) / 2 / this.size);
    const iy = Math.floor((a.y + b.y) / 2 / this.size);
    const k = this.key(ix, iy);
    const list = this.cells.get(k);
    if (list) list.push({ a, b, room });
    else this.cells.set(k, [{ a, b, room }]);
  }

  addRun(run: P[], room = 0, closed = false): void {
    for (let i = 1; i < run.length; i++) this.add(run[i - 1], run[i], room);
    if (closed && run.length > 2) this.add(run[run.length - 1], run[0], room);
  }

  // Whether any segment comes closer to p than r plus its own room
  within(p: P, r: number): boolean {
    // segments are filed by their middle, so look one segment-length further
    const reach = r + this.maxRoom + this.size;
    const x0 = Math.floor((p.x - reach) / this.size);
    const x1 = Math.floor((p.x + reach) / this.size);
    const y0 = Math.floor((p.y - reach) / this.size);
    const y1 = Math.floor((p.y + reach) / this.size);
    for (let ix = x0; ix <= x1; ix++)
      for (let iy = y0; iy <= y1; iy++) {
        const list = this.cells.get(this.key(ix, iy));
        if (!list) continue;
        for (const { a, b, room } of list)
          if (segmentDistance(p, a, b) < r + room) return true;
      }
    return false;
  }
}

export function segmentDistance(p: P, a: P, b: P): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t =
    lengthSq === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq)
        );
  return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y);
}

// How far from `from` the edge of a closed outline is, heading towards `to` (the first edge
// at or beyond `to`)
export function reachToEdge(from: P, to: P, poly: P[]): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return 0;
  const ux = dx / length;
  const uy = dy / length;
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const cross = ux * ey - uy * ex;
    if (Math.abs(cross) < 1e-9) continue;
    const t = ((a.x - from.x) * ey - (a.y - from.y) * ex) / cross;
    const u = ((a.x - from.x) * uy - (a.y - from.y) * ux) / cross;
    if (u >= 0 && u <= 1 && t >= length * 0.999 && t < best) best = t;
  }
  return best === Infinity ? length : best;
}

// Every stroke of a battleground, bottom to top
