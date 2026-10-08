import { MapPath, PathAssignment, PathPoint, Unit } from "../types";
import {
  headingAtDistance,
  offsetFromHeading,
  samplePath,
} from "./pathGeometry";
import {
  DEFAULT_FORWARD_ANGLE,
  defaultTravelMode,
  effectiveForward,
  normalizeDegrees,
} from "./unitFacing";

// What the formation maths needs to know about a unit. Only the position is required; the
// rest describe how it is facing and default the same way they do everywhere else.
export type FormationUnit = Pick<Unit, "id" | "x" | "y"> &
  Partial<
    Pick<
      Unit,
      "rotation" | "flipped" | "forwardAngle" | "travelMode" | "assetType"
    >
  >;

// "keep": the formation stays as placed and units turn on the spot (the path has no direction).
// "wheel": the whole group turns with its units (the path has a direction to turn from).
export type FormationMode = "keep" | "wheel";

export interface Attachment {
  points: PathPoint[];
  assignments: PathAssignment[];
  direction: number | undefined; // degrees; undefined when the formation is kept as placed
}

const MOVE_TOLERANCE = 1e-6;
const RAD = Math.PI / 180;

const mean = (values: number[]) =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

// The direction a unit is facing on screen (degrees), or null if it doesn't turn to face travel
function facingDegrees(unit: FormationUnit): number | null {
  const travelMode = unit.travelMode ?? defaultTravelMode(unit.assetType);
  if (travelMode !== "rotate") return null;
  const forward = unit.forwardAngle ?? DEFAULT_FORWARD_ANGLE;
  return effectiveForward(forward, !!unit.flipped) + (unit.rotation ?? 0);
}

// The average of several directions (degrees), or null if they cancel out
function circularMeanDegrees(angles: number[]): number | null {
  if (angles.length === 0) return null;
  const sin = angles.reduce((sum, a) => sum + Math.sin(a * RAD), 0);
  const cos = angles.reduce((sum, a) => sum + Math.cos(a * RAD), 0);
  if (Math.hypot(sin, cos) < 1e-6) return null;
  return normalizeDegrees(Math.atan2(sin, cos) / RAD);
}

const startHeadingDegrees = (points: PathPoint[]) =>
  headingAtDistance(samplePath(points), 0) / RAD;

// The direction the group faces: the average facing of the units that turn to face travel,
// or the path's start heading if there are none
function groupDirection(units: FormationUnit[], points: PathPoint[]): number {
  const facings = units
    .map(facingDegrees)
    .filter((angle): angle is number => angle !== null);
  return circularMeanDegrees(facings) ?? startHeadingDegrees(points);
}

// The frame (radians) a path's slots are measured against: its direction if it has one,
// otherwise its start heading
function frameFor(direction: number | undefined, points: PathPoint[]): number {
  return direction !== undefined
    ? direction * RAD
    : headingAtDistance(samplePath(points), 0);
}

// Each unit's place in the formation: its distance along and to the right of the frame,
// measured from the path's start point
function recordSlots(
  points: PathPoint[],
  units: FormationUnit[],
  frame: number
): PathAssignment[] {
  const start = points[0];
  return units.map((unit) => ({
    unitId: unit.id,
    ...offsetFromHeading({ x: unit.x - start.x, y: unit.y - start.y }, frame),
  }));
}

// Works out a path's new points and formation slots when units are attached to it.
//
// - If the selection covers every unit already on the path (or there are none), it is a
//   fresh formation: the path's start moves to the group's centre, so no unit teleports.
// - Otherwise the start stays where it is, and the new units' slots are measured against it.
//
// A path that has a direction turns its group with its units, so a fresh formation takes
// its direction from the way the units face. A path without one keeps the formation as placed.
export function attachUnits(
  path: MapPath,
  units: FormationUnit[]
): Attachment | null {
  if (units.length === 0 || path.points.length < 2) return null;

  const selected = new Set(units.map((unit) => unit.id));
  const isFreshFormation = path.assignments.every((a) =>
    selected.has(a.unitId)
  );

  const points = isFreshFormation
    ? [
        { x: mean(units.map((u) => u.x)), y: mean(units.map((u) => u.y)) },
        ...path.points.slice(1),
      ]
    : path.points;

  const turnsWithUnits = path.direction !== undefined;
  const direction = !turnsWithUnits
    ? undefined
    : isFreshFormation
      ? groupDirection(units, points)
      : path.direction;

  const kept = isFreshFormation
    ? []
    : path.assignments.filter((a) => !selected.has(a.unitId));

  return {
    points,
    direction,
    assignments: [
      ...kept,
      ...recordSlots(points, units, frameFor(direction, points)),
    ],
  };
}

// Switches a path between keeping its formation as placed and turning it with its units.
// Nobody moves: the path's points stay, and the slots are re-measured against the new frame.
// A formation that turns with its units faces the way they face on average, or the way just
// `facingFrom` face when given (the timeline passes the units arriving from earlier marches).
export function changeFormationMode(
  path: MapPath,
  units: FormationUnit[],
  mode: FormationMode,
  facingFrom?: FormationUnit[]
): { direction: number | undefined; assignments: PathAssignment[] } {
  const byId = new Map<string, FormationUnit>(
    units.map((unit): [string, FormationUnit] => [unit.id, unit])
  );
  const present = path.assignments
    .map((a) => byId.get(a.unitId))
    .filter((unit): unit is FormationUnit => unit !== undefined);

  const direction =
    mode === "wheel"
      ? groupDirection(
          facingFrom && facingFrom.length > 0 ? facingFrom : present,
          path.points
        )
      : undefined;
  return {
    direction,
    assignments: recordSlots(
      path.points,
      present,
      frameFor(direction, path.points)
    ),
  };
}

// Keeps paths consistent after units have been moved, so nothing jumps when playback starts:
// - every attached unit moved by the same amount: the path start goes with them
// - only some moved: the start stays, and the slots are re-recorded from the new positions
// Paths whose attached units did not move are returned untouched.
export function reanchorPaths(
  paths: MapPath[],
  before: FormationUnit[],
  after: FormationUnit[],
  skip: ReadonlySet<string> = new Set()
): MapPath[] {
  const beforeById = new Map<string, FormationUnit>(
    before.map((unit): [string, FormationUnit] => [unit.id, unit])
  );
  const afterById = new Map<string, FormationUnit>(
    after.map((unit): [string, FormationUnit] => [unit.id, unit])
  );

  return paths.map((path) => {
    if (skip.has(path.id)) return path;
    if (path.assignments.length === 0 || path.points.length < 2) return path;

    const units: FormationUnit[] = [];
    const moves: { dx: number; dy: number }[] = [];
    for (const assignment of path.assignments) {
      const was = beforeById.get(assignment.unitId);
      const now = afterById.get(assignment.unitId);
      if (!was || !now) return path;
      units.push(now);
      moves.push({ dx: now.x - was.x, dy: now.y - was.y });
    }

    const anyMoved = moves.some(
      (m) => Math.abs(m.dx) > MOVE_TOLERANCE || Math.abs(m.dy) > MOVE_TOLERANCE
    );
    if (!anyMoved) return path;

    const first = moves[0];
    const movedTogether = moves.every(
      (m) =>
        Math.abs(m.dx - first.dx) < MOVE_TOLERANCE &&
        Math.abs(m.dy - first.dy) < MOVE_TOLERANCE
    );

    const points = movedTogether
      ? [
          { x: path.points[0].x + first.dx, y: path.points[0].y + first.dy },
          ...path.points.slice(1),
        ]
      : path.points;

    return {
      ...path,
      points,
      assignments: recordSlots(points, units, frameFor(path.direction, points)),
    };
  });
}

// Re-records the formation slots after a path's points change, measuring from the units'
// current positions, so nothing jumps when playback starts
export function rerecordSlots(
  path: MapPath,
  points: PathPoint[],
  units: FormationUnit[]
): PathAssignment[] {
  const byId = new Map<string, FormationUnit>(
    units.map((unit): [string, FormationUnit] => [unit.id, unit])
  );
  const present = path.assignments
    .map((a) => byId.get(a.unitId))
    .filter((unit): unit is FormationUnit => unit !== undefined);
  return recordSlots(points, present, frameFor(path.direction, points));
}
