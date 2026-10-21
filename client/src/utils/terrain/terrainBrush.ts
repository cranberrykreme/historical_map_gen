import {
  difference,
  intersection,
  MultiPolygon,
  Pair,
  Polygon,
  union,
} from "polygon-clipping";
import { PathPoint, TerrainFeature, TerrainKind } from "../../types";
import { isLine, newTerrainId, sampleCurve } from "./terrain";

// The terrain brush and eraser. A brush stroke is the path the mouse took and the brush's
// radius; what it sweeps over is a band of that width with round ends. Everything here works on
// the features' shapes and gives back the changes to make, as one edit (one undo step):
//
//  - Painting an area kind (a forest) joins the stroke onto every area of that kind it touches,
//    as one feature; touching none, it's a new one.
//  - Painting a line kind (a river) draws a freehand line along the stroke, smoothed.
//  - Erasing cuts the stroke out of the areas under it (leaving holes or splitting them) and
//    out of the lines (cutting them into pieces): of one kind, or of every kind.
//
// Shapes come back as ordinary features (a smooth curve through a handful of points, with any
// holes), so they can still be reshaped with their handles afterwards.

type P = PathPoint;

// The changes a stroke makes to a battle's terrain: features to take away, features to replace
// (by id), and new features to add on top
export interface TerrainEdit {
  remove: string[];
  update: TerrainFeature[];
  add: TerrainFeature[];
}

export const EMPTY_EDIT: TerrainEdit = { remove: [], update: [], add: [] };

export const isEmptyEdit = (edit: TerrainEdit) =>
  edit.remove.length === 0 && edit.update.length === 0 && edit.add.length === 0;

// The brush's radius, in map units: the smallest, the largest, and what it starts at
export const BRUSH_MIN = 6;
export const BRUSH_MAX = 200;
export const BRUSH_DEFAULT = 30;

// How closely the outlines that come back follow the exact shape (map units): looser means
// fewer points to drag about
const OUTLINE_TOLERANCE = 3;
const LINE_TOLERANCE = 2;
// Pieces of area smaller than this (square map units, about 14 × 14) are crumbs, and dropped
const MIN_AREA = 200;
// Pieces of line shorter than this are dropped
const MIN_LINE = 12;

// ---- Small geometry ----

const ringArea = (ring: P[]) => {
  let twice = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    twice += a.x * b.y - b.x * a.y;
  }
  return Math.abs(twice) / 2;
};

const lengthOf = (run: P[]) => {
  let length = 0;
  for (let i = 1; i < run.length; i++)
    length += Math.hypot(run[i].x - run[i - 1].x, run[i].y - run[i - 1].y);
  return length;
};

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

// Fewer points along an open run, keeping it within `tolerance` of where it was
// (Douglas–Peucker). The ends always stay.
export function simplifyRun(run: P[], tolerance: number): P[] {
  if (run.length <= 2) return run.map(({ x, y }) => ({ x, y }));
  const keep = new Array<boolean>(run.length).fill(false);
  keep[0] = true;
  keep[run.length - 1] = true;
  const stack: [number, number][] = [[0, run.length - 1]];
  while (stack.length > 0) {
    const [from, to] = stack.pop()!;
    let worst = -1;
    let worstDistance = tolerance;
    for (let i = from + 1; i < to; i++) {
      const d = segmentDistance(run[i], run[from], run[to]);
      if (d > worstDistance) {
        worst = i;
        worstDistance = d;
      }
    }
    if (worst >= 0) {
      keep[worst] = true;
      stack.push([from, worst], [worst, to]);
    }
  }
  return run.filter((_, i) => keep[i]).map(({ x, y }) => ({ x, y }));
}

// Fewer points round a closed ring: split at the point furthest from the first, and each half
// simplified as a run
export function simplifyRing(ring: P[], tolerance: number): P[] {
  if (ring.length <= 4) return ring.map(({ x, y }) => ({ x, y }));
  let far = 0;
  let farDistance = -1;
  ring.forEach((p, i) => {
    const d = Math.hypot(p.x - ring[0].x, p.y - ring[0].y);
    if (d > farDistance) {
      far = i;
      farDistance = d;
    }
  });
  const first = simplifyRun(ring.slice(0, far + 1), tolerance);
  const second = simplifyRun([...ring.slice(far), ring[0]], tolerance);
  return [...first, ...second.slice(1, -1)];
}

// ---- Shapes as the clipping library has them ----

const toRing = (points: P[]): Pair[] => {
  const ring = points.map((p) => [p.x, p.y] as Pair);
  if (ring.length > 0) ring.push([ring[0][0], ring[0][1]]);
  return ring;
};

const fromRing = (ring: Pair[]): P[] => {
  const points = ring.map(([x, y]) => ({ x, y }));
  // the library repeats the first point at the end
  const first = points[0];
  const last = points[points.length - 1];
  if (points.length > 1 && first.x === last.x && first.y === last.y)
    points.pop();
  return points;
};

// An area feature's shape: its smooth edge and holes, as the drawing has them
export function featurePolygon(feature: TerrainFeature): Polygon {
  return [
    toRing(sampleCurve(feature.points, true, 4)),
    ...(feature.holes ?? []).map((hole) => toRing(sampleCurve(hole, true, 4))),
  ];
}

// The stroke's middle line, with the mouse's wobbles smoothed out (less than a tenth of the
// brush's size, so the band barely changes)
const strokeSpine = (stroke: P[], radius: number) =>
  simplifyRun(stroke, Math.max(0.5, radius / 10));

// A capsule: the band round one straight stretch of the stroke, with round ends
function capsule(a: P, b: P, radius: number): Polygon {
  const sides = 16; // points round each half circle
  const heading = Math.atan2(b.y - a.y, b.x - a.x);
  const points: P[] = [];
  // round the far end, then back round the near end
  for (let i = 0; i <= sides; i++) {
    const t = heading - Math.PI / 2 + (i / sides) * Math.PI;
    points.push({
      x: b.x + Math.cos(t) * radius,
      y: b.y + Math.sin(t) * radius,
    });
  }
  for (let i = 0; i <= sides; i++) {
    const t = heading + Math.PI / 2 + (i / sides) * Math.PI;
    points.push({
      x: a.x + Math.cos(t) * radius,
      y: a.y + Math.sin(t) * radius,
    });
  }
  return [toRing(points)];
}

// The band a stroke sweeps over: a capsule round each straight stretch of it, joined into one
// shape
export function strokePolygon(stroke: P[], radius: number): MultiPolygon {
  if (stroke.length === 0) return [];
  const spine = strokeSpine(stroke, radius);
  const parts =
    spine.length === 1
      ? [capsule(spine[0], spine[0], radius)]
      : spine.slice(1).map((p, i) => capsule(spine[i], p, radius));
  return parts.length === 1 ? [parts[0]] : union(parts[0], ...parts.slice(1));
}

// The pieces of a shape worth keeping, biggest first, as a feature's points and holes (each a
// handful of points through which the smooth curve runs)
function pieces(
  shape: MultiPolygon
): { points: P[]; holes?: P[][]; area: number }[] {
  const out: { points: P[]; holes?: P[][]; area: number }[] = [];
  for (const [outer, ...inner] of shape) {
    const outerPoints = fromRing(outer);
    const holes = inner
      .map(fromRing)
      .filter((hole) => ringArea(hole) >= MIN_AREA);
    const area =
      ringArea(outerPoints) - holes.reduce((sum, h) => sum + ringArea(h), 0);
    if (area < MIN_AREA) continue;
    const points = simplifyRing(outerPoints, OUTLINE_TOLERANCE);
    if (points.length < 3) continue;
    const simpleHoles = holes
      .map((hole) => simplifyRing(hole, OUTLINE_TOLERANCE))
      .filter((hole) => hole.length >= 3);
    out.push(
      simpleHoles.length > 0
        ? { points, holes: simpleHoles, area }
        : { points, area }
    );
  }
  return out.sort((a, b) => b.area - a.area);
}

// A feature with a new shape (its holes gone if the new shape has none)
const reshaped = (
  feature: TerrainFeature,
  shape: { points: P[]; holes?: P[][] }
): TerrainFeature => {
  const { holes: _old, ...rest } = feature;
  return shape.holes
    ? { ...rest, points: shape.points, holes: shape.holes }
    : { ...rest, points: shape.points };
};

const newFeature = (
  kind: TerrainKind,
  shape: { points: P[]; holes?: P[][] }
): TerrainFeature =>
  shape.holes
    ? { id: newTerrainId(), kind, points: shape.points, holes: shape.holes }
    : { id: newTerrainId(), kind, points: shape.points };

type Box = { x0: number; y0: number; x1: number; y1: number };
const boxOf = (points: P[]): Box => ({
  x0: Math.min(...points.map((p) => p.x)),
  y0: Math.min(...points.map((p) => p.y)),
  x1: Math.max(...points.map((p) => p.x)),
  y1: Math.max(...points.map((p) => p.y)),
});
const boxesMeet = (a: Box, b: Box, pad = 0) =>
  a.x0 - pad <= b.x1 &&
  b.x0 - pad <= a.x1 &&
  a.y0 - pad <= b.y1 &&
  b.y0 - pad <= a.y1;

// ---- Painting ----

// Painting an area kind: the stroke joins every area of that kind it touches into one (the
// first of them in the list keeps its name and place; the others are taken away), or becomes a
// new area if it touches none. A stroke can also join into several pieces if it ends up apart.
export function paintArea(
  features: TerrainFeature[],
  kind: TerrainKind,
  stroke: P[],
  radius: number
): TerrainEdit {
  if (isLine(kind) || stroke.length === 0) return EMPTY_EDIT;
  const band = strokePolygon(stroke, radius);
  if (band.length === 0) return EMPTY_EDIT;
  const reach = boxOf(stroke);
  const touching = features.filter(
    (f) =>
      f.kind === kind &&
      boxesMeet(boxOf(f.points), reach, radius) &&
      intersection(featurePolygon(f), band).length > 0
  );
  const joined = touching.length
    ? union(band, ...touching.map(featurePolygon))
    : band;
  const shapes = pieces(joined);
  if (shapes.length === 0) return EMPTY_EDIT;
  if (touching.length === 0)
    return {
      remove: [],
      update: [],
      add: shapes.map((s) => newFeature(kind, s)),
    };
  const [keeper, ...gone] = touching;
  return {
    remove: gone.map((f) => f.id),
    update: [reshaped(keeper, shapes[0])],
    add: shapes.slice(1).map((s) => newFeature(kind, s)),
  };
}

// Painting a line kind: a freehand line along the stroke, smoothed into a few points. Too
// short a stroke makes nothing.
export function paintLine(kind: TerrainKind, stroke: P[]): TerrainEdit {
  if (!isLine(kind) || stroke.length < 2 || lengthOf(stroke) < MIN_LINE)
    return EMPTY_EDIT;
  const points = simplifyRun(stroke, LINE_TOLERANCE);
  if (points.length < 2) return EMPTY_EDIT;
  return {
    remove: [],
    update: [],
    add: [{ id: newTerrainId(), kind, points }],
  };
}

// ---- Erasing ----

// Erasing: cuts the stroke out of every feature under it, of `kind` only, or of every kind
// when `kind` is null. An area keeps the biggest piece left (as itself) and the others become
// new areas of its kind; nothing left, and it's taken away. A line is cut into pieces the same
// way.
export function eraseTerrain(
  features: TerrainFeature[],
  stroke: P[],
  radius: number,
  kind: TerrainKind | null
): TerrainEdit {
  if (stroke.length === 0) return EMPTY_EDIT;
  const band = strokePolygon(stroke, radius);
  const spine = strokeSpine(stroke, radius);
  const reach = boxOf(stroke);
  const under = (p: P) =>
    spine.length === 1
      ? Math.hypot(p.x - spine[0].x, p.y - spine[0].y) < radius
      : spine.slice(1).some((q, i) => segmentDistance(p, spine[i], q) < radius);
  const edit: TerrainEdit = { remove: [], update: [], add: [] };
  for (const feature of features) {
    if (kind !== null && feature.kind !== kind) continue;
    if (!boxesMeet(boxOf(feature.points), reach, radius + 40)) continue;
    if (isLine(feature.kind)) {
      const dense = sampleCurve(feature.points, false, 3);
      const keep = dense.map((p) => !under(p));
      if (keep.every(Boolean)) continue;
      const runs: P[][] = [];
      let current: P[] = [];
      dense.forEach((p, i) => {
        if (keep[i]) current.push(p);
        else if (current.length) {
          runs.push(current);
          current = [];
        }
      });
      if (current.length) runs.push(current);
      const kept = runs
        .filter((run) => run.length >= 2 && lengthOf(run) >= MIN_LINE)
        .map((run) => simplifyRun(run, LINE_TOLERANCE));
      if (kept.length === 0) edit.remove.push(feature.id);
      else {
        edit.update.push({ ...feature, points: kept[0] });
        kept
          .slice(1)
          .forEach((points) =>
            edit.add.push({ id: newTerrainId(), kind: feature.kind, points })
          );
      }
      continue;
    }
    const shape = featurePolygon(feature);
    if (intersection(shape, band).length === 0) continue;
    const left = pieces(difference(shape, band));
    if (left.length === 0) edit.remove.push(feature.id);
    else {
      edit.update.push(reshaped(feature, left[0]));
      left.slice(1).forEach((s) => edit.add.push(newFeature(feature.kind, s)));
    }
  }
  return edit;
}

// A battle's terrain with an edit made to it: replaced features stay where they were in the
// list, taken-away ones go, and new ones go on top
export function applyTerrainEdit(
  features: TerrainFeature[],
  edit: TerrainEdit
): TerrainFeature[] {
  const gone = new Set(edit.remove);
  const replaced = new Map(edit.update.map((f) => [f.id, f]));
  return [
    ...features
      .filter((f) => !gone.has(f.id))
      .map((f) => replaced.get(f.id) ?? f),
    ...edit.add,
  ];
}
