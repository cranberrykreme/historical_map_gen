import {
  Battle,
  BattleKind,
  PathPoint,
  TerrainFeature,
  TerrainKind,
  TerrainStyle,
} from "../types";
import {
  alongLine,
  areaCentre,
  baseStrokes,
  circlePath,
  church,
  GROUND_COLOUR,
  holesPath,
  house,
  inPolygon,
  Item,
  isLine,
  itemStrokes,
  LINE_WIDTH,
  lineStrokes,
  LineRun,
  polylinePath,
  rectCorners,
  rectsOverlap,
  RIVER_WIDTH,
  ringPoints,
  sampleCurve,
  scatterItems,
  shrink,
  smoothPath,
  sortedFeatures,
  strokesSvg,
  TerrainStroke,
  TERRAIN_KINDS,
} from "./terrain";
import {
  styleGround,
  styleOverlay,
  stylePatterns,
  styleStrokes,
} from "./terrainStyles";

export { inPolygon };

// How a whole battleground is drawn: every feature, and the ways they meet. All of it is
// worked out from the shapes each time, so moving a river moves its mouth, its bridges and
// the lane it cuts through a wood.
//
//  1. A river or stream running into the sea or a lake stops exactly at the shore (an island's
//     beach included) and fans out into the water.
//  2. A river's free end (its source, the end it was drawn from) narrows to a trickle.
//  3. A road crossing a river gets a bridge, and crossing a stream a ford. Walls, palisades,
//     ditches and roads stop at water.
//  4. Roads, rivers and streams clear a lane through woods and towns, ending exactly at their
//     edges; a road through a town becomes a street lined with rows of terrace houses. A big
//     town gets a market square on its main street and a church. A walled town has a wall
//     with towers round it, and a gate wherever a road comes in.
//  5. Land meeting water gets a surf line and a ring of shallows; a sea in a land battle gets
//     a beach, and a lake a clear shoreline and a damp green bank.
//  6. Overlapping areas of one kind merge into one, with no edge across the middle; lines of
//     a kind join up, and streams flow into rivers.
//  7. Hills and mountains are lit from the top left and shaded to the bottom right, over
//     whatever stands on them, ridges too; trees and houses on high ground (ridges included) are
//     drawn a little bigger (nearer the camera) and over the ones below them.
//  8. Marsh beside water gets wetter towards it, inside the marsh only.
//  9. Snow lies on everything inside a snow area: trees, roofs and rocks get snow on them,
//     roads are dusted white, lakes, seas and rivers freeze over, and peaks get big snow caps.
// 10. An area's holes (a clearing in a forest, an island in a lake) are outside it in every
//     way: nothing of it is drawn there, and its edge, shore or coast runs round them too.
//
// Trees, peaks, rocks and houses are scattered one by one (see scatterItems), each drawn whole
// or not at all: never cut by an area's edge, a road, a river or a wall.
//
// No two buildings ever overlap: each has an outline, checked against the ones already built.

type P = PathPoint;

const WATER_KINDS = new Set<TerrainKind>(["deep", "shallows", "lake", "reef"]);
const WOOD_KINDS = new Set<TerrainKind>(["forest", "pines", "orchard"]);
const TOWN_KINDS = new Set<TerrainKind>(["town", "walled"]);
const LANE_LINES = new Set<TerrainKind>(["road", "river", "stream"]);
const STOPS_AT_WATER = new Set<TerrainKind>([
  "road",
  "wall",
  "palisade",
  "ditch",
  "ridge",
]);
const BREAKS_AT_RIVERS = new Set<TerrainKind>(["wall", "palisade", "ditch"]);

// How close to the battle's edge a river's end must be to run off it, rather than start there
const EDGE = 12;
// A street through a town: how wide it's cleared, how far from the road's middle its row of
// terrace houses stands, how big each house is, and how much room the other buildings leave
// the street
const STREET = 52;
const ROW_SET_BACK = 20.5;
const UNIT_LONG = 10.5;
const UNIT_DEEP = 13;
const STREET_ROOM = 40;
// A walled town's wall: how far inside the town's edge it runs, and how much room the houses
// leave it
const WALL_INSET = 7;
const WALL_ROOM = 16;

interface Area {
  feature: TerrainFeature;
  poly: P[]; // the outline as short straight steps
  holes: P[][]; // its holes, the same way
  d: string; // the outline and holes as smooth curves
  rule?: "evenodd"; // how to fill or clip to `d`: even-odd when it has holes
  box: { x0: number; y0: number; x1: number; y1: number };
}

const boxOf = (poly: P[]) => ({
  x0: Math.min(...poly.map((p) => p.x)),
  y0: Math.min(...poly.map((p) => p.y)),
  x1: Math.max(...poly.map((p) => p.x)),
  y1: Math.max(...poly.map((p) => p.y)),
});

const makeArea = (feature: TerrainFeature): Area => {
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
const inArea = (p: P, area: Area) =>
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
interface Edge {
  run: P[];
  normals: P[];
  closed: boolean;
}
function edgeRuns(
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
const areaEdges = (area: Area, test: (p: P, outward: P) => boolean): Edge[] => [
  ...edgeRuns(area.poly, test),
  ...area.holes.flatMap((hole) => edgeRuns(hole, test, true)),
];

// An edge moved out (or in, for a negative distance) along its normals
const offset = (edge: Edge, distance: number): P[] =>
  edge.run.map((p, i) => ({
    x: p.x + edge.normals[i].x * distance,
    y: p.y + edge.normals[i].y * distance,
  }));

const edgePath = (edge: Edge, distance = 0) =>
  polylinePath(distance ? offset(edge, distance) : edge.run, edge.closed);

// The stretches of a run where `keep` holds
function splitRun(
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

const nearestDistance = (p: P, run: P[]) => {
  let best = Infinity;
  for (const q of run) best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
  return best;
};

// Where two runs cross, with the first run's direction there. The second run is cut into
// short pieces with boxes round them, so most of it is skipped at a glance.
function crossings(a: P[], b: P[]): { at: P; dir: P }[] {
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
function mouth(at: P, dir: P, width: number, colour: string): TerrainStroke[] {
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
function interleave(lists: TerrainStroke[][]): TerrainStroke[] {
  const out: TerrainStroke[] = [];
  const most = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < most; i++)
    for (const list of lists) if (list[i]) out.push(list[i]);
  return out;
}

const unit = (from: P, to: P): P => {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
};

// Whether two areas overlap at all
function overlaps(a: Area, b: Area): boolean {
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
class SegmentGrid {
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

function segmentDistance(p: P, a: P, b: P): number {
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
function reachToEdge(from: P, to: P, poly: P[]): number {
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
export function battleStrokes(
  features: TerrainFeature[],
  ground: BattleKind,
  width: number,
  height: number
): TerrainStroke[] {
  const sorted = sortedFeatures(features);
  const areas = sorted.filter((f) => !isLine(f.kind)).map(makeArea);
  const water = (p: P) => waterAt(p, areas, ground);
  const lines = sorted.filter((f) => isLine(f.kind));
  // How far an area's edge line reaches out past its shape (an island's beach). The edge is
  // drawn twice as wide under the fill, so all of its width shows outside.
  const rims = new Map(
    areas.map((a) => [a.feature.id, baseStrokes(a.feature)[0]?.width ?? 0])
  );
  const rimOf = (area: Area) =>
    WATER_KINDS.has(area.feature.kind) ? 0 : (rims.get(area.feature.id) ?? 0);
  const rimAt = (p: P) => {
    for (let i = areas.length - 1; i >= 0; i--)
      if (inArea(p, areas[i])) return rimOf(areas[i]);
    return 0;
  };
  const nearEdge = (p: P) =>
    p.x < EDGE || p.y < EDGE || p.x > width - EDGE || p.y > height - EDGE;
  const snowAreas = areas.filter((a) => a.feature.kind === "snow");
  const underSnow = (p: P) => snowAreas.some((a) => inArea(p, a));

  // How high the ground is at a point: a dome over each hill (1 at the top) and mountain
  // (higher still), and a long rise along each ridge
  const highGround = areas
    .filter((a) => a.feature.kind === "hill" || a.feature.kind === "mountain")
    .map((area) => ({
      area,
      middle: areaCentre(area.feature.points),
      peak: area.feature.kind === "mountain" ? 1.5 : 1,
    }));
  const ridges = lines
    .filter((l) => l.kind === "ridge")
    .map((l) => {
      const run = sampleCurve(l.points, false, 6);
      const box = boxOf(run);
      return { run, box };
    });
  const RIDGE_HALF = 23;
  const heightAt = (p: P) => {
    let h = 0;
    for (const { area, middle, peak } of highGround) {
      if (!inArea(p, area)) continue;
      const reach = reachToEdge(middle, p, area.poly);
      const s =
        reach > 0
          ? Math.min(1, Math.hypot(p.x - middle.x, p.y - middle.y) / reach)
          : 0;
      h = Math.max(h, peak * (1 - s * s));
    }
    for (const { run, box } of ridges) {
      if (
        p.x < box.x0 - RIDGE_HALF ||
        p.x > box.x1 + RIDGE_HALF ||
        p.y < box.y0 - RIDGE_HALF ||
        p.y > box.y1 + RIDGE_HALF
      )
        continue;
      const d = nearestDistance(p, run);
      if (d < RIDGE_HALF) h = Math.max(h, 1 - (d / RIDGE_HALF) ** 2);
    }
    return h;
  };

  // Where the land ends, beaches included, as clip shapes: rivers are drawn only inside them,
  // so a river into the sea stops exactly at the shore
  const landShapes: string[] = areas
    .filter((a) => !WATER_KINDS.has(a.feature.kind))
    .map((a) => {
      // the edge and the holes' edges, each moved out past the beach (into the holes too)
      const edges = areaEdges(a, () => true);
      return edges.length
        ? edges
            .map((edge) => polylinePath(offset(edge, rimOf(a) + 1), true))
            .join("")
        : a.d;
    });
  if (ground === "land")
    landShapes.unshift(
      `M-50 -50H${width + 50}V${height + 50}H-50Z` +
        areas
          .filter((a) => WATER_KINDS.has(a.feature.kind))
          .map((a) =>
            [a.poly, ...a.holes]
              .map((ring) => polylinePath(ring, true))
              .join("")
          )
          .join("")
    );

  // ---- Rivers and streams: where they run on land, their mouths and their sources ----
  const riverLines = lines
    .filter((f) => f.kind === "river" || f.kind === "stream")
    .map((feature) => {
      const dense = sampleCurve(feature.points, false, 5);
      return { feature, dense, wet: dense.map(water) };
    });
  const mouths: TerrainStroke[] = [];
  const lineRuns = new Map<string, LineRun[]>();
  const reachesWater = new Set<string>();
  for (const { feature, dense, wet } of riverLines) {
    const [bank] = RIVER_WIDTH[feature.kind]!;
    const light = feature.kind === "river" ? "#6fa6db" : "#7fb2e0";
    const others = riverLines.filter((r) => r.feature.id !== feature.id);
    // What's at an end of the line: it runs off the battle, into another river, or nowhere
    const end = (p: P) =>
      nearEdge(p)
        ? "open"
        : others.some(
              (o) =>
                nearestDistance(p, o.dense) <
                RIVER_WIDTH[o.feature.kind]![0] / 2 + 6
            )
          ? "join"
          : "free";
    const runs: LineRun[] = [];
    for (const { from, to } of splitRun(dense, (_, i) => !wet[i])) {
      const startsInWater = from > 0;
      const endsInWater = to < dense.length - 1;
      // Into the water, a river runs on well past the shore and is clipped there (see
      // landShapes), and its mouth fans out from just past the beach
      const steps = (i: number, extra: number) =>
        Math.ceil((rimAt(dense[i]) + extra) / 5);
      const a = startsInWater ? Math.max(from - steps(from, 40), 0) : from;
      const b = endsInWater
        ? Math.min(to + steps(to, 40), dense.length - 1)
        : to;
      const run = dense.slice(a, b + 1);
      if (run.length < 2) continue;
      if (startsInWater) {
        const m = Math.max(from - steps(from, 3), 0);
        mouths.push(
          ...mouth(dense[m], unit(dense[m + 1], dense[m]), bank * 1.3, light)
        );
      }
      if (endsInWater) {
        const m = Math.min(to + steps(to, 3), dense.length - 1);
        mouths.push(
          ...mouth(dense[m], unit(dense[m - 1], dense[m]), bank * 1.3, light)
        );
      }
      if (startsInWater || endsInWater) reachesWater.add(feature.id);
      const startFree = !startsInWater && end(dense[0]) === "free";
      const endFree = !endsInWater && end(dense[dense.length - 1]) === "free";
      runs.push({
        run,
        start: startsInWater ? "flare" : startFree ? "taper" : "round",
        end: endsInWater ? "flare" : endFree && !startFree ? "taper" : "round",
      });
    }
    lineRuns.set(feature.id, runs);
  }
  const riverRuns = riverLines.flatMap(({ feature }) =>
    (lineRuns.get(feature.id) ?? []).map((r) => ({
      kind: feature.kind,
      run: r.run,
    }))
  );
  const riverGrid = new SegmentGrid();
  for (const { kind, run } of riverRuns)
    riverGrid.addRun(run, RIVER_WIDTH[kind]![0] / 2 + 3);
  const inRiver = (p: P) => riverGrid.within(p, 0);

  // ---- Every other line, stopping at water (and walls at rivers) ----
  for (const feature of lines) {
    if (lineRuns.has(feature.id)) continue;
    const dense = sampleCurve(feature.points, false, 4);
    if (!STOPS_AT_WATER.has(feature.kind)) {
      lineRuns.set(feature.id, [{ run: dense }]);
      continue;
    }
    const breaks = BREAKS_AT_RIVERS.has(feature.kind);
    const keep = dense.map((p) => !water(p) && !(breaks && inRiver(p)));
    lineRuns.set(
      feature.id,
      splitRun(dense, (_, i) => keep[i])
        .map(({ from, to }) => ({ run: dense.slice(from, to + 1) }))
        .filter((r) => r.run.length >= 2)
    );
  }

  // How much room each line needs kept clear of an area's items: a lane through a wood or a
  // street through a town, or just the line itself
  const clearance = (line: TerrainFeature, area: Area) => {
    const w = LINE_WIDTH[line.kind] ?? 10;
    if (!LANE_LINES.has(line.kind)) return w / 2 + 2;
    if (TOWN_KINDS.has(area.feature.kind))
      return line.kind === "road" ? STREET_ROOM : (w + 30) / 2 + 2;
    return (w + 24) / 2 + 1;
  };
  // A walled town's wall and its gates, worked out once
  const walls = new Map<Area, { runs: P[][]; gates: P[] }>();
  for (const area of areas.filter((a) => a.feature.kind === "walled")) {
    const edge = edgeRuns(area.poly, () => true)[0];
    if (!edge) continue;
    const ring = offset(edge, -WALL_INSET);
    const closed = [...ring, ring[0]];
    const gates: { at: P; half: number }[] = [];
    for (const line of lines.filter((l) => LANE_LINES.has(l.kind)))
      for (const { run } of lineRuns.get(line.id) ?? [])
        for (const { at } of crossings(closed, run))
          gates.push({
            at,
            half:
              line.kind === "road" ? 14 : (LINE_WIDTH[line.kind] ?? 10) / 2 + 6,
          });
    const keep = ring.map((p) =>
      gates.every((g) => Math.hypot(p.x - g.at.x, p.y - g.at.y) > g.half)
    );
    let runs: P[][];
    if (keep.every(Boolean)) runs = [closed];
    else {
      // start from a gap, so a wall running round past the first point stays in one piece
      const start = keep.indexOf(false);
      const turned = [...ring.slice(start), ...ring.slice(0, start)];
      const turnedKeep = [...keep.slice(start), ...keep.slice(0, start)];
      runs = splitRun(turned, (_, i) => turnedKeep[i]).map(({ from, to }) =>
        turned.slice(from, to + 1)
      );
    }
    walls.set(area, {
      runs: runs.filter((r) => r.length >= 2),
      gates: gates.map((g) => g.at),
    });
  }

  // ---- Each town's plan: a market square on its main street, and a church ----
  interface TownPlan {
    square?: { at: P; angle: number; long: number; deep: number };
    church?: { at: P; angle: number };
    keepOut: { x: number; y: number; r: number }[]; // where no other building goes
  }
  const roadGrid = new SegmentGrid();
  for (const line of lines.filter((l) => l.kind === "road"))
    for (const { run } of lineRuns.get(line.id) ?? []) roadGrid.addRun(run);
  const plans = new Map<Area, TownPlan>();
  for (const area of areas.filter((a) => TOWN_KINDS.has(a.feature.kind))) {
    const margin = area.feature.kind === "walled" ? WALL_INSET + WALL_ROOM : 4;
    const fitsIn = (p: P, r: number) =>
      inArea(p, area) &&
      ringPoints(p.x, p.y, r + margin).every((q) => inArea(q, area));
    let size = 0;
    area.poly.forEach((p, i) => {
      const q = area.poly[(i + 1) % area.poly.length];
      size += p.x * q.y - q.x * p.y;
    });
    size = Math.abs(size) / 2;
    const middle = areaCentre(area.poly);
    const plan: TownPlan = { keepOut: [] };
    // the market square: on the street nearest the middle of town, or in the middle
    if (size > 35000) {
      let best: { at: P; angle: number; distance: number } | null = null;
      for (const line of lines.filter((l) => l.kind === "road"))
        for (const { run } of lineRuns.get(line.id) ?? [])
          for (const { x, y, dx, dy } of alongLine(run, 8)) {
            const distance = Math.hypot(x - middle.x, y - middle.y);
            if ((!best || distance < best.distance) && fitsIn({ x, y }, 44))
              best = { at: { x, y }, angle: Math.atan2(dy, dx), distance };
          }
      if (best)
        plan.square = { at: best.at, angle: best.angle, long: 66, deep: 60 };
      else if (fitsIn(middle, 36))
        plan.square = { at: middle, angle: 0, long: 50, deep: 50 };
      if (plan.square) plan.keepOut.push({ ...plan.square.at, r: 46 });
    }
    // the church: the first spot near the middle with room for it, clear of the streets
    if (size > 50000)
      search: for (let ring = 0; ring <= 300; ring += 18)
        for (let k = 0; k < (ring === 0 ? 1 : 12); k++) {
          const a = (k / 12) * Math.PI * 2;
          const at = {
            x: middle.x + Math.cos(a) * ring,
            y: middle.y + Math.sin(a) * ring,
          };
          if (!fitsIn(at, 34)) continue;
          if (roadGrid.within(at, 34 + STREET_ROOM)) continue;
          if (
            plan.keepOut.some(
              (o) => Math.hypot(o.x - at.x, o.y - at.y) < o.r + 36
            )
          )
            continue;
          plan.church = { at, angle: 0 };
          plan.keepOut.push({ ...at, r: 36 });
          break search;
        }
    plans.set(area, plan);
  }

  // Where an area's items may go: wholly inside the areas of its kind (and inside the wall of
  // a walled town), drawn by the first of them that covers the spot, and clear of later areas
  // over it, of roads, rivers and walls
  const scatterFor = (area: Area, index: number) => {
    const kind = area.feature.kind;
    const same = areas.filter((a) => a.feature.kind === kind);
    const mine = same.indexOf(area);
    const margin = kind === "walled" ? WALL_INSET + WALL_ROOM : 0;
    const inSame = (p: P) => same.some((a) => inArea(p, a));
    // The outer edge of all the areas of this kind together: the parts of each one's edge
    // that aren't inside another
    const edges = new SegmentGrid();
    for (const a of same) {
      const others = same.filter((o) => o !== a);
      for (const ring of [a.poly, ...a.holes]) {
        const n = ring.length;
        for (let i = 0; i < n; i++) {
          const p = ring[i];
          const q = ring[(i + 1) % n];
          const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
          if (!others.some((o) => inArea(mid, o))) edges.add(p, q);
        }
      }
    }
    // Areas drawn over this one, which would hide part of an item
    const covering = areas.filter(
      (a, i) => i > index && a.feature.kind !== kind && overlaps(a, area)
    );
    const coverEdges = new SegmentGrid();
    // their edge line reaches a little past their shape
    for (const a of covering)
      for (const ring of [a.poly, ...a.holes])
        coverEdges.addRun(ring, rimOf(a) + 1.5, true);
    // Roads, rivers and walls, with the room each needs kept clear
    const pad = 80;
    const near = (p: P) =>
      p.x > area.box.x0 - pad &&
      p.x < area.box.x1 + pad &&
      p.y > area.box.y0 - pad &&
      p.y < area.box.y1 + pad;
    const obstacles = new SegmentGrid();
    for (const line of lines) {
      // trees and houses stand on a ridge, not round it
      if (line.kind === "bridge" || line.kind === "ridge") continue;
      const room = clearance(line, area);
      for (const { run } of lineRuns.get(line.id) ?? [])
        for (let i = 1; i < run.length; i++)
          if (near(run[i])) obstacles.add(run[i - 1], run[i], room);
    }
    // a town's square and church, and its old-town blocks once they're placed
    const keepOut = [...(plans.get(area)?.keepOut ?? [])];
    return {
      keepOut,
      fits: (x: number, y: number, r: number) =>
        inSame({ x, y }) && !edges.within({ x, y }, r + margin),
      owns: (x: number, y: number) =>
        !same.slice(0, mine).some((a) => inArea({ x, y }, a)),
      blocked: (x: number, y: number, r: number) =>
        covering.some((a) => inArea({ x, y }, a)) ||
        coverEdges.within({ x, y }, r) ||
        obstacles.within({ x, y }, r) ||
        keepOut.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r + 2),
      snowy: (x: number, y: number) => underSnow({ x, y }),
      height: (x: number, y: number) => heightAt({ x, y }),
    };
  };

  const out: TerrainStroke[] = [];

  // ---- Areas, kind by kind ----
  for (const { kind } of TERRAIN_KINDS) {
    const ofKind = areas.filter((a) => a.feature.kind === kind);
    if (ofKind.length > 0) {
      const strokes = ofKind.map((a) => baseStrokes(a.feature));
      const before: TerrainStroke[] = [];
      const after: TerrainStroke[] = [];
      for (let i = 0; i < ofKind.length; i++) {
        const area = ofKind[i];
        const rim = strokes[i][0]?.width ?? 0;
        if (WATER_KINDS.has(kind)) {
          // Water meeting land: a beach for the sea, a shoreline and a damp bank for a lake
          const shore = areaEdges(
            area,
            (p, n) => !water({ x: p.x + n.x * 9, y: p.y + n.y * 9 })
          );
          for (const edge of shore) {
            if (kind === "deep" || kind === "shallows") {
              before.push({ d: edgePath(edge), stroke: "#dccb93", width: 26 });
              if (kind === "deep")
                after.push({
                  d: edgePath(edge, -15),
                  stroke: "#7fb6d9",
                  width: 20,
                  opacity: 0.45,
                });
              after.push({
                d: edgePath(edge, -4),
                stroke: "#eaf4f8",
                width: 2.5,
                opacity: 0.7,
              });
            } else if (kind === "lake") {
              // a crisp edge tracing the shore, inside a damp green bank
              before.push({
                d: edgePath(edge),
                stroke: "#6f8f4f",
                width: 26,
                opacity: 0.5,
              });
              after.push({ d: edgePath(edge), stroke: "#2f6aa0", width: 3 });
              after.push({
                d: edgePath(edge, -4),
                stroke: "#8cc0e8",
                width: 2,
                opacity: 0.7,
              });
            }
          }
        } else {
          // Land meeting water
          const coast = areaEdges(area, (p, n) =>
            water({ x: p.x + n.x * (rim + 9), y: p.y + n.y * (rim + 9) })
          );
          for (const edge of coast) {
            if (kind === "marsh") {
              // Wetter towards the water, fading into the marsh, and only inside the marsh
              for (const [band, opacity] of [
                [44, 0.25],
                [26, 0.3],
                [12, 0.35],
              ])
                after.push({
                  d: edgePath(edge),
                  stroke: "#6f9fa0",
                  width: band,
                  opacity,
                  cap: "butt",
                  clip: area.d,
                  clipRule: area.rule,
                });
            } else {
              before.push({
                d: edgePath(edge),
                stroke: "#7fb6d9",
                width: rim * 2 + 30,
                opacity: 0.5,
              });
              before.push({
                d: edgePath(edge, rim + 8),
                stroke: "#eaf4f8",
                width: 2.5,
                opacity: 0.75,
              });
            }
          }
        }
      }
      // High ground casts a soft shadow away from the light
      if (kind === "hill" || kind === "mountain")
        for (const area of ofKind) {
          const shift = (ring: P[]) =>
            smoothPath(
              ring.map((p) => ({ x: p.x + 10, y: p.y + 12 })),
              true
            );
          before.unshift({
            d:
              shift(area.feature.points) +
              (area.feature.holes ?? []).map(shift).join(""),
            fill: "#2a2a10",
            opacity: 0.14,
            shading: true,
            fillRule: area.rule,
          });
        }
      out.push(...before);
      // Every outline under every fill, so overlapping shapes of one kind become one
      for (const list of strokes) {
        const s = list[0];
        if (s?.stroke)
          out.push({
            d: s.d,
            stroke: s.stroke,
            width: (s.width ?? 1) * 2,
            opacity: s.opacity,
          });
      }
      for (const list of strokes) {
        const s = list[0];
        if (s)
          out.push({
            d: s.d,
            fill: s.fill,
            opacity: s.opacity,
            fillRule: s.fillRule,
          });
      }
      for (const list of strokes) out.push(...list.slice(1));
      out.push(...after);
      // A mountain under snow is paler, under its snowy peaks
      if (kind === "mountain")
        for (const high of ofKind)
          for (const cover of snowAreas)
            if (overlaps(high, cover))
              out.push({
                d: high.d,
                fill: "#f2f6f8",
                opacity: 0.45,
                fillRule: high.rule,
                clip: cover.d,
                clipRule: cover.rule,
              });
      // The ground under trees and between houses is white under snow
      if (WOOD_KINDS.has(kind) || TOWN_KINDS.has(kind))
        for (const area of ofKind)
          for (const cover of snowAreas)
            if (overlaps(area, cover))
              out.push({
                d: area.d,
                fill: "#f4f7f9",
                opacity: 0.6,
                fillRule: area.rule,
                clip: cover.d,
                clipRule: cover.rule,
              });
      for (const area of ofKind) {
        const ctx = scatterFor(area, areas.indexOf(area));
        // a town's old-town blocks first, then its houses round them
        if (TOWN_KINDS.has(kind))
          out.push(
            ...scatterItems(
              area.feature,
              { ...ctx, placed: (x, y, r) => ctx.keepOut.push({ x, y, r }) },
              "courtyard"
            )
          );
        out.push(...scatterItems(area.feature, ctx));
      }
    }

    // Rivers' mouths, on the water but under any land, marsh or beach drawn over it
    if (kind === "reef") out.push(...mouths);

    // Water under snow is frozen over: ice over the snow, where the water is
    if (kind === "snow")
      for (const cover of snowAreas) {
        const pools = areas.filter(
          (a) => WATER_KINDS.has(a.feature.kind) && overlaps(cover, a)
        );
        // in a sea battle the open sea is water too
        const shapes = ground === "sea" ? [cover] : pools;
        const clip = { clip: cover.d, clipRule: cover.rule };
        for (const { d, rule } of shapes)
          out.push(
            { d, fill: "#e3eff5", opacity: 0.95, fillRule: rule, ...clip },
            { d, fill: "pattern:ice", fillRule: rule, ...clip },
            { d, stroke: "#8fb6cc", width: 3, ...clip }
          );
      }

    // Ridges: long, narrow hills among the high ground, with a soft shadow
    if (kind === "mountain")
      for (const ridge of lines.filter((l) => l.kind === "ridge")) {
        const runs = lineRuns.get(ridge.id) ?? [];
        out.push({
          d: runs
            .map(({ run }) =>
              polylinePath(run.map((p) => ({ x: p.x + 10, y: p.y + 12 })))
            )
            .join(""),
          stroke: "#2a2a10",
          width: 46,
          opacity: 0.12,
          shading: true,
        });
        out.push(...lineStrokes("ridge", runs));
      }

    // A hill under snow turns white
    if (kind === "mountain") {
      for (const high of areas.filter((a) => a.feature.kind === "hill"))
        for (const cover of snowAreas)
          if (overlaps(high, cover))
            out.push({
              d: high.d,
              fill: "#f2f6f8",
              opacity: 0.55,
              fillRule: high.rule,
              clip: cover.d,
              clipRule: cover.rule,
            });
    }
    // High ground lit from the top left and shaded to the bottom right, over the trees and
    // houses standing on it
    if (kind === "walled")
      for (const { area } of highGround) {
        const points = area.feature.points;
        const rings = area.feature.kind === "hill" ? [1, 0.68, 0.38] : [1, 0.6];
        for (const factor of rings)
          out.push({
            d:
              smoothPath(shrink(points, factor), true) +
              holesPath(area.feature),
            fill: "pattern:shade",
            opacity: area.feature.kind === "hill" ? 0.5 : 0.4,
            shading: true,
            fillRule: area.rule,
          });
      }
    // and ridges lit along their top-left side, shaded along the other
    if (kind === "walled")
      for (const ridge of lines.filter((l) => l.kind === "ridge")) {
        const runs = lineRuns.get(ridge.id) ?? [];
        const shifted = (dx: number, dy: number) =>
          runs
            .map(({ run }) =>
              polylinePath(run.map((p) => ({ x: p.x + dx, y: p.y + dy })))
            )
            .join("");
        out.push({
          d: shifted(-6, -7),
          stroke: "#ffffff",
          width: 24,
          opacity: 0.11,
          shading: true,
        });
        out.push({
          d: shifted(6, 7),
          stroke: "#000000",
          width: 24,
          opacity: 0.1,
          shading: true,
        });
      }
  }

  // ---- Lanes through woods, streets through towns ----
  // Each is drawn along the whole line but clipped to the wood or town, so it starts and
  // stops exactly at its edge
  const settled = areas.filter(
    (a) => WOOD_KINDS.has(a.feature.kind) || TOWN_KINDS.has(a.feature.kind)
  );
  const laneLines = lines.filter((f) => LANE_LINES.has(f.kind));
  const streetHouses = new Map<
    Area,
    { x: number; y: number; corners: P[]; row: string; item: Item }[]
  >();
  for (const feature of laneLines) {
    const runs = (lineRuns.get(feature.id) ?? []).map((r) => r.run);
    const d = runs.map((run) => polylinePath(run)).join("");
    const w = LINE_WIDTH[feature.kind] ?? 10;
    const road = feature.kind === "road";
    // Where the other roads and rivers run, so houses aren't built on them
    const others = new SegmentGrid();
    for (const o of laneLines)
      if (o.id !== feature.id)
        for (const { run } of lineRuns.get(o.id) ?? [])
          others.addRun(run, (LINE_WIDTH[o.kind] ?? 10) / 2 + 10);
    for (const area of settled) {
      if (!runs.some((run) => run.some((p) => inArea(p, area)))) continue;
      if (!TOWN_KINDS.has(area.feature.kind)) {
        // A clearing through the trees, edged like the wood
        const edge = baseStrokes(area.feature)[0]?.stroke ?? "#4a7030";
        out.push({
          d,
          stroke: edge,
          width: w + 24,
          clip: area.d,
          clipRule: area.rule,
        });
        out.push({
          d,
          stroke: GROUND_COLOUR.land,
          width: w + 18,
          clip: area.d,
          clipRule: area.rule,
        });
        for (const cover of snowAreas)
          if (overlaps(area, cover))
            out.push({
              d,
              stroke: "#f4f7f9",
              width: w + 18,
              opacity: 0.75,
              clip: cover.d,
              clipRule: cover.rule,
            });
        continue;
      }
      // Through a town: a cleared street (or a stone quay for a river), lined on each side with
      // rows of terrace houses, each house wholly inside the town (and its wall)
      const inTown = { clip: area.d, clipRule: area.rule };
      out.push({
        d,
        stroke: "#cbbf9f",
        width: road ? STREET : w + 30,
        ...inTown,
      });
      out.push({
        d,
        stroke: road ? "#bfb193" : "#a59c88",
        width: w + 12,
        ...inTown,
      });
      if (!road) continue;
      const margin =
        area.feature.kind === "walled" ? WALL_INSET + WALL_ROOM : 0;
      const keepOut = plans.get(area)?.keepOut ?? [];
      const list = streetHouses.get(area) ?? [];
      // This road itself, so a house on the inside of a tight bend isn't built on it
      const ownRoad = new SegmentGrid();
      for (const run of runs) ownRoad.addRun(run, ROW_SET_BACK - 4);
      const inside = (p: P, r: number) =>
        inArea(p, area) &&
        ringPoints(p.x, p.y, r + margin).every((q) => inArea(q, area));
      runs.forEach((run, runIndex) =>
        [-1, 1].forEach((side) => {
          let row = `${feature.id}:${runIndex}:${side}:0`;
          let inRow = 0;
          let rowLength = 4;
          let rowShade = 0;
          alongLine(run, UNIT_LONG).forEach(({ x, y, dx, dy }, i) => {
            const startRow = () => {
              row = `${feature.id}:${runIndex}:${side}:${i}`;
              inRow = 0;
              // rows of 3 to 6 houses, each row its own colour
              rowLength = 3 + ((((i * 7 + side * 5 + runIndex) % 4) + 4) % 4);
              rowShade = ((((i * 3 + side) % 4) + 4) % 4) / 4;
            };
            // a narrow alley between rows
            if (inRow >= rowLength) {
              startRow();
              return;
            }
            const n = { x: -dy, y: dx };
            const c = {
              x: x + n.x * side * ROW_SET_BACK,
              y: y + n.y * side * ROW_SET_BACK,
            };
            const unitR = Math.hypot(UNIT_LONG / 2, UNIT_DEEP / 2);
            const corners = rectCorners(
              c.x,
              c.y,
              UNIT_LONG,
              UNIT_DEEP,
              Math.atan2(dy, dx)
            );
            const clear =
              inside(c, unitR - 1) &&
              !others.within(c, 0) &&
              !ownRoad.within(c, 0) &&
              !keepOut.some(
                (o) => Math.hypot(o.x - c.x, o.y - c.y) < o.r + unitR
              ) &&
              // no two houses overlapping at all, in this row or any other: houses side by
              // side in a row only touch
              !list.some(
                (o) =>
                  Math.hypot(o.x - c.x, o.y - c.y) < o.item.r + unitR &&
                  rectsOverlap(o.corners, corners)
              );
            if (!clear) {
              if (inRow > 0) startRow();
              return;
            }
            if (inRow === 0) startRow();
            const h = heightAt(c);
            const item = house(
              c.x,
              c.y,
              UNIT_LONG,
              UNIT_DEEP,
              Math.atan2(dy, dx),
              rowShade,
              underSnow(c),
              i % 2 === 0
            );
            item.level = Math.min(5, Math.floor(h * 3));
            list.push({ x: c.x, y: c.y, corners, row, item });
            inRow++;
          });
        })
      );
      streetHouses.set(area, list);
    }
  }
  // The terrace houses, after every street is cleared, so no street runs over them
  streetHouses.forEach((list, area) =>
    out.push(
      ...itemStrokes(
        area.feature.kind,
        list.map((h) => h.item)
      )
    )
  );
  // Each town's square (paved, with a well and market stalls) and church
  plans.forEach((plan) => {
    if (plan.square) {
      const { at, angle, long, deep } = plan.square;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const corner = (a: number, b: number) =>
        `${Math.round((at.x + dx * a - dy * b) * 10) / 10} ${Math.round((at.y + dy * a + dx * b) * 10) / 10}`;
      const rect = (a: number, b: number, l: number, w: number) =>
        `M${corner(a - l / 2, b - w / 2)}L${corner(a + l / 2, b - w / 2)}L${corner(a + l / 2, b + w / 2)}L${corner(a - l / 2, b + w / 2)}Z`;
      out.push({
        d: rect(0, 0, long, deep),
        fill: "#d8ccad",
        stroke: "#a89878",
        width: 1.2,
      });
      // stalls along both sides, clear of the road through the middle
      const stalls = ["#c9a36a", "#a8604a", "#d4c08a"];
      stalls.forEach((colour, k) =>
        out.push({
          d: [-1, 1]
            .map((side) =>
              [-28, -14, 14, 28]
                .filter((_, j) => (j + k) % 3 === 0)
                .map((a) => rect(a, side * (deep / 2 - 7), 10, 7))
                .join("")
            )
            .join(""),
          fill: colour,
          stroke: "#6e4a35",
          width: 0.8,
        })
      );
      out.push({
        // the well, to one side of the road
        d: circlePath(at.x + dy * 17, at.y - dx * 17, 4.5),
        fill: "#7a8a98",
        stroke: "#4f5a64",
        width: 1.2,
      });
    }
    if (plan.church) {
      const item = church(
        plan.church.at.x,
        plan.church.at.y,
        plan.church.angle,
        underSnow(plan.church.at)
      );
      out.push(...itemStrokes("town", [item]));
    }
  });
  // ---- Town walls, with towers along them and a pair at each gate ----
  walls.forEach(({ runs, gates }) => {
    out.push(
      ...lineStrokes(
        "wall",
        runs.map((run) => ({ run }))
      )
    );
    const towers: P[] = [];
    for (const run of runs) {
      alongLine(run, 70).forEach((p) => towers.push(p));
      if (gates.length > 0) towers.push(run[0], run[run.length - 1]);
    }
    if (towers.length)
      out.push({
        d: towers.map((p) => circlePath(p.x, p.y, 6.5)).join(""),
        fill: "#9a958a",
        stroke: "#5e594f",
        width: 1.5,
      });
  });

  // ---- Lines, kind by kind, joined up ----
  const groups: TerrainKind[][] = [
    ["river", "stream"],
    // (ridges are drawn with the high ground)
    ...TERRAIN_KINDS.filter(
      (k) =>
        k.shape === "line" &&
        k.kind !== "river" &&
        k.kind !== "stream" &&
        k.kind !== "ridge"
    ).map((k) => [k.kind]),
  ];
  const userBridges = lines
    .filter((f) => f.kind === "bridge")
    .map((f) => sampleCurve(f.points, false, 5));
  for (const kinds of groups) {
    const members = lines.filter((f) => kinds.includes(f.kind));
    out.push(
      ...interleave(
        members.map((f) =>
          lineStrokes(f.kind, lineRuns.get(f.id) ?? []).map((s) =>
            // A river into water is drawn only on land, so it ends exactly at the shore
            reachesWater.has(f.id)
              ? { ...s, clip: landShapes, clipRule: "evenodd" as const }
              : s
          )
        )
      )
    );
    // Under snow, rivers freeze and roads are dusted white
    for (const cover of snowAreas)
      for (const f of members) {
        const runs = (lineRuns.get(f.id) ?? []).map((r) => r.run);
        if (!runs.some((run) => run.some((p) => inArea(p, cover)))) continue;
        const d = runs.map((run) => polylinePath(run)).join("");
        if (f.kind === "river" || f.kind === "stream")
          out.push({
            d,
            stroke: "#e3eff5",
            width: RIVER_WIDTH[f.kind]![0] - 5,
            clip: cover.d,
            clipRule: cover.rule,
          });
        else if (f.kind === "road")
          out.push({
            d,
            stroke: "#f1f4f6",
            width: 9,
            opacity: 0.8,
            dash: "6 3",
            clip: cover.d,
            clipRule: cover.rule,
          });
      }
    if (kinds[0] !== "road") continue;
    // Bridges and fords where roads cross rivers and streams
    for (const road of members)
      for (const { run } of lineRuns.get(road.id) ?? [])
        for (const { kind, run: river } of riverRuns)
          for (const { at, dir } of crossings(run, river)) {
            if (userBridges.some((b) => nearestDistance(at, b) < 30)) continue;
            if (water(at)) continue;
            const [bank] = RIVER_WIDTH[kind]!;
            if (kind === "river") {
              const half = bank / 2 + 10;
              out.push(
                ...lineStrokes("bridge", [
                  {
                    run: [
                      { x: at.x - dir.x * half, y: at.y - dir.y * half },
                      { x: at.x + dir.x * half, y: at.y + dir.y * half },
                    ],
                  },
                ])
              );
            } else {
              const piece = river.filter(
                (p) => Math.hypot(p.x - at.x, p.y - at.y) < 13
              );
              out.push(
                ...lineStrokes("stream", [{ run: piece }]).map((s) => ({
                  ...s,
                  opacity: 0.8,
                }))
              );
              const n = { x: -dir.y, y: dir.x };
              for (const k of [-1, 0, 1])
                out.push({
                  d: circlePath(
                    at.x + dir.x * k * 4.5 + n.x * k * 1.5,
                    at.y + dir.y * k * 4.5 + n.y * k * 1.5,
                    2.2
                  ),
                  fill: "#c4bfb0",
                  stroke: "#7f7a6c",
                  width: 0.8,
                });
            }
          }
  }

  // A light dusting of snow over everything inside a snow area
  for (const cover of snowAreas)
    out.push({
      d: cover.d,
      fill: "#ffffff",
      opacity: 0.28,
      fillRule: cover.rule,
    });

  return out;
}

// Every stroke of a battleground in the battle's style (see terrainStyles): recoloured, with
// whatever the style draws on top (hachures, contours, paper grain)
export function styledBattleStrokes(
  features: TerrainFeature[],
  ground: BattleKind,
  width: number,
  height: number,
  style?: TerrainStyle
): TerrainStroke[] {
  return styleBattle(
    battleStrokes(features, ground, width, height),
    features,
    width,
    height,
    style
  );
}

// Strokes already worked out for a battleground, put in a style
export const styleBattle = (
  strokes: TerrainStroke[],
  features: TerrainFeature[],
  width: number,
  height: number,
  style?: TerrainStyle
): TerrainStroke[] =>
  !style || style === "painted"
    ? strokes
    : [
        ...styleStrokes(strokes, style),
        ...styleOverlay(features, width, height, style),
      ];

// The whole battleground as an SVG file: the ground, every feature and the ways they meet, at
// the battle's size in map units, in the battle's style. The renderer draws from this (9.6),
// so the video matches the editor.
export function terrainSvg(battle: Battle): string {
  const strokes = styledBattleStrokes(
    battle.terrain ?? [],
    battle.kind,
    battle.width,
    battle.height,
    battle.style
  );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${battle.width}" height="${battle.height}" ` +
    `viewBox="0 0 ${battle.width} ${battle.height}"><defs>${stylePatterns(battle.style)}</defs>` +
    `<rect width="${battle.width}" height="${battle.height}" fill="${styleGround(battle.kind, battle.style)}"/>` +
    `${strokesSvg(strokes)}</svg>`
  );
}
