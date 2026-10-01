import { PathPoint } from "../types";

type Point = PathPoint;

interface BezierSegment {
  p0: Point;
  c1: Point;
  c2: Point;
  p1: Point;
}

export interface PathSample extends Point {
  distance: number;
  // The curve's own direction of travel here, in radians. It is kept continuous from one
  // sample to the next, so it never jumps by a full turn between neighbours.
  angle: number;
}

export interface SampledPath {
  samples: PathSample[];
  length: number;
}

export interface FormationOffset {
  forward: number;
  right: number;
}

const RAD_TO_DEG = 180 / Math.PI;

// A smooth curve through every waypoint (Catmull-Rom, expressed as cubic Bezier segments)
export function buildSegments(points: Point[]): BezierSegment[] {
  if (points.length < 2) return [];
  const segments: BezierSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const before = points[i - 1] ?? p0;
    const after = points[i + 2] ?? p1;
    segments.push({
      p0,
      c1: { x: p0.x + (p1.x - before.x) / 6, y: p0.y + (p1.y - before.y) / 6 },
      c2: { x: p1.x - (after.x - p0.x) / 6, y: p1.y - (after.y - p0.y) / 6 },
      p1,
    });
  }
  return segments;
}

// The curve as an SVG path string, for drawing on the map
export function svgPathData(points: Point[]): string {
  const segments = buildSegments(points);
  if (segments.length === 0) return "";
  let d = `M ${segments[0].p0.x} ${segments[0].p0.y}`;
  for (const s of segments) {
    d += ` C ${s.c1.x} ${s.c1.y} ${s.c2.x} ${s.c2.y} ${s.p1.x} ${s.p1.y}`;
  }
  return d;
}

function bezierPoint(s: BezierSegment, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * s.p0.x + b * s.c1.x + c * s.c2.x + d * s.p1.x,
    y: a * s.p0.y + b * s.c1.y + c * s.c2.y + d * s.p1.y,
  };
}

function bezierTangent(s: BezierSegment, t: number): Point {
  const u = 1 - t;
  const a = 3 * u * u;
  const b = 6 * u * t;
  const c = 3 * t * t;
  return {
    x: a * (s.c1.x - s.p0.x) + b * (s.c2.x - s.c1.x) + c * (s.p1.x - s.c2.x),
    y: a * (s.c1.y - s.p0.y) + b * (s.c2.y - s.c1.y) + c * (s.p1.y - s.c2.y),
  };
}

export function samplePath(points: Point[], stepsPerSegment = 40): SampledPath {
  const segments = buildSegments(points);
  if (segments.length === 0) {
    return points.length === 1
      ? { samples: [{ ...points[0], distance: 0, angle: 0 }], length: 0 }
      : { samples: [], length: 0 };
  }

  // The curve's own direction of travel at a point, kept continuous from sample to sample
  let lastAngle: number | null = null;
  const angleAt = (segment: BezierSegment, t: number): number => {
    const tangent = bezierTangent(segment, t);
    const along =
      Math.hypot(tangent.x, tangent.y) < 1e-9
        ? { x: segment.p1.x - segment.p0.x, y: segment.p1.y - segment.p0.y }
        : tangent;
    const raw = Math.atan2(along.y, along.x);
    lastAngle =
      lastAngle === null
        ? raw
        : lastAngle +
          Math.atan2(Math.sin(raw - lastAngle), Math.cos(raw - lastAngle));
    return lastAngle;
  };

  const samples: PathSample[] = [
    { ...segments[0].p0, distance: 0, angle: angleAt(segments[0], 0) },
  ];
  let total = 0;
  for (const segment of segments) {
    let prev = segment.p0;
    for (let step = 1; step <= stepsPerSegment; step++) {
      const t = step / stepsPerSegment;
      const p = bezierPoint(segment, t);
      total += Math.hypot(p.x - prev.x, p.y - prev.y);
      samples.push({ ...p, distance: total, angle: angleAt(segment, t) });
      prev = p;
    }
  }
  return { samples, length: total };
}

export function pointAtDistance(path: SampledPath, distance: number): Point {
  const { samples, length } = path;
  if (samples.length === 0) return { x: 0, y: 0 };
  if (samples.length === 1 || length === 0)
    return { x: samples[0].x, y: samples[0].y };

  const d = Math.min(Math.max(distance, 0), length);
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].distance <= d) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  const span = b.distance - a.distance;
  const t = span === 0 ? 0 : (d - a.distance) / span;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// Direction of travel in radians (0 = right, π/2 = down) at a distance along the path,
// taken from the curve's own tangent so it changes smoothly instead of in steps
export function headingAtDistance(path: SampledPath, distance: number): number {
  const { samples, length } = path;
  if (samples.length === 0) return 0;
  if (samples.length === 1 || length === 0) return samples[0].angle;

  const d = Math.min(Math.max(distance, 0), length);
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].distance <= d) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  const span = b.distance - a.distance;
  const t = span === 0 ? 0 : (d - a.distance) / span;
  return a.angle + (b.angle - a.angle) * t;
}

// Where a point sits relative to a centre, measured along and to the right of a heading
export function offsetFromHeading(
  delta: Point,
  heading: number
): FormationOffset {
  const fx = Math.cos(heading);
  const fy = Math.sin(heading);
  return {
    forward: delta.x * fx + delta.y * fy,
    right: -delta.x * fy + delta.y * fx,
  };
}

// The inverse: the map position of a formation slot for a given centre and heading
export function applyOffset(
  base: Point,
  offset: FormationOffset,
  heading: number
): Point {
  const fx = Math.cos(heading);
  const fy = Math.sin(heading);
  return {
    x: base.x + offset.forward * fx - offset.right * fy,
    y: base.y + offset.forward * fy + offset.right * fx,
  };
}

// The rotation (degrees, as used by unit.rotation) that makes a unit's art face the heading.
// A mirrored unit's front points the opposite way horizontally, so its facing flips too.
export function facingRotation(
  heading: number,
  forwardAngleDeg: number,
  flipped: boolean
): number {
  const effectiveForward = flipped ? 180 - forwardAngleDeg : forwardAngleDeg;
  return heading * RAD_TO_DEG - effectiveForward;
}

export interface NearestOnPath {
  point: Point;
  // The segment (between waypoint i and i + 1) the nearest point lies on
  segmentIndex: number;
  // Straight-line distance from the target to that point
  distance: number;
}

// The closest point on the curve to a target, and which segment it belongs to,
// so a new waypoint can be inserted in the right place in the list
export function nearestOnPath(
  points: Point[],
  target: Point,
  stepsPerSegment = 200
): NearestOnPath | null {
  const { samples } = samplePath(points, stepsPerSegment);
  if (samples.length < 2) return null;

  let bestIndex = 0;
  let bestDistance = Infinity;
  samples.forEach((sample, i) => {
    const d = Math.hypot(sample.x - target.x, sample.y - target.y);
    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = i;
    }
  });

  // Sample 0 is the start; samples 1..N belong to segment 0, N+1..2N to segment 1, and so on
  const segmentIndex = Math.min(
    Math.max(Math.ceil(bestIndex / stepsPerSegment) - 1, 0),
    points.length - 2
  );
  return {
    point: { x: samples[bestIndex].x, y: samples[bestIndex].y },
    segmentIndex,
    distance: bestDistance,
  };
}

export interface Chevron {
  x: number;
  y: number;
  heading: number; // radians, direction of travel
}

// Evenly spaced direction markers along a path, kept away from the very ends.
// Spacing is in map units; maxCount stops a very long path drawing hundreds.
export function chevronsAlong(
  points: Point[],
  spacing: number,
  maxCount = 150
): Chevron[] {
  const path = samplePath(points);
  if (path.length === 0 || spacing <= 0) return [];

  const count = Math.min(
    Math.max(Math.floor(path.length / spacing), 1),
    maxCount
  );
  const step = path.length / count;
  const chevrons: Chevron[] = [];
  for (let i = 0; i < count; i++) {
    const distance = (i + 0.5) * step;
    const p = pointAtDistance(path, distance);
    chevrons.push({
      x: p.x,
      y: p.y,
      heading: headingAtDistance(path, distance),
    });
  }
  return chevrons;
}

export interface TravelSideChange {
  distance: number;
  right: boolean;
}

// Whether a path is heading right or left across the screen, decided once for the whole
// path and stored as the distances where it changes. Small wobbles around vertical are
// ignored (dead zone), so a unit that must stay upright doesn't flicker back and forth,
// and the answer for a given distance never depends on how you got there.
export function buildTravelSides(
  path: SampledPath,
  deadZone = 0.35
): TravelSideChange[] {
  const { samples } = path;
  if (samples.length === 0) return [{ distance: 0, right: true }];

  const changes: TravelSideChange[] = [];
  let current: boolean | null = null;
  for (const sample of samples) {
    const across = Math.cos(headingAtDistance(path, sample.distance));
    if (current === null) {
      current = across >= 0;
      changes.push({ distance: 0, right: current });
    } else if (current && across < -deadZone) {
      current = false;
      changes.push({ distance: sample.distance, right: false });
    } else if (!current && across > deadZone) {
      current = true;
      changes.push({ distance: sample.distance, right: true });
    }
  }
  return changes;
}

export function travelSideAt(
  changes: TravelSideChange[],
  distance: number
): boolean {
  let right = changes[0]?.right ?? true;
  for (const change of changes) {
    if (change.distance <= distance) right = change.right;
    else break;
  }
  return right;
}
