// Terrain: the shapes features are drawn with (smooth curves, lines, ticks and ribbons)

import { PathPoint } from "../../types";

export const round = (n: number) => Math.round(n * 100) / 100;
// A point as SVG path text
export const pt = (x: number, y: number) => `${round(x)} ${round(y)}`;

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
export function dots(run: PathPoint[], spacing: number, r: number): string {
  return alongLine(run, spacing)
    .map(({ x, y }) => circlePath(x, y, r))
    .join("");
}

// Triangles hanging off the right of a run (the drop of a cliff)
export function teeth(
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
export function ribbon(
  run: PathPoint[],
  width: (along: number) => number
): string {
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
