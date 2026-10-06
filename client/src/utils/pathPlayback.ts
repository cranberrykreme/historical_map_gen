import { MapPath, Unit } from "../types";
import {
  applyOffset,
  buildTravelSides,
  facingRotation,
  headingAtDistance,
  pointAtDistance,
  samplePath,
  travelSideAt,
} from "./pathGeometry";
import { normalizeDegrees, unitFacing } from "./unitFacing";

export interface PlaybackState {
  x: number;
  y: number;
  rotation: number;
  flipped: boolean;
}

// How fast the group pivots on the spot before it sets off, in degrees of turn per map unit
// of playback. 0.6 means a quarter turn takes 150 units (1.5 seconds at 1x). Lower is slower.
export const PIVOT_DEGREES_PER_UNIT = 0.6;

// How much of each march's travelling time is spent speeding up at the start, and the same
// again slowing down at the end
export const EASE_FRACTION = 0.1;

// How far along the route (0 to 1) a march is after `fraction` (0 to 1) of its travelling time.
// Speed builds up evenly over the first 10%, holds steady, and eases off evenly over the last
// 10%. The total time doesn't change: the steady part is a little quicker to make up for it.
export function easeTravel(
  fraction: number,
  ramp: number = EASE_FRACTION
): number {
  const u = Math.min(Math.max(fraction, 0), 1);
  if (ramp <= 0) return u;
  const a = Math.min(ramp, 0.5);
  const top = 1 / (1 - a); // the steady speed, as a share of the average
  if (u < a) return (top * u * u) / (2 * a);
  if (u <= 1 - a) return top * (u - a / 2);
  return 1 - (top * (1 - u) * (1 - u)) / (2 * a);
}

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

// Whether the art's own front points right (rather than left) when unmirrored.
// Art that faces straight up or down has no side and counts as facing right.
export function artFacesRight(forwardAngleDeg: number): boolean {
  return Math.cos((forwardAngleDeg * Math.PI) / 180) > -1e-9;
}

interface Pivot {
  groupFacing: number; // degrees: the way the group faces at rest
  frameTurn: number; // degrees the block must turn to face the path's start heading
  unitTurns: Map<string, number>; // degrees each unit that turns to face travel must turn
  largest: number; // degrees: the biggest of all those turns
  length: number; // how long the pivot lasts, in map units of playback
}

// The turn the group makes on the spot before it sets off. Each turn-mode unit turns until it
// faces the path's start heading, and a group that turns with its units rotates as a block
// too. A group that keeps its formation as placed has no direction, so only the units turn.
// The pivot lasts until the last of them has finished.
function pivotFor(
  path: MapPath,
  units: Unit[],
  startHeading: number,
  rate: number
): Pivot {
  const startHeadingDeg = startHeading * RAD_TO_DEG;
  const groupFacing = path.direction ?? startHeadingDeg;
  const frameTurn = normalizeDegrees(startHeadingDeg - groupFacing);

  const byId = new Map<string, Unit>(
    units.map((unit): [string, Unit] => [unit.id, unit])
  );
  const unitTurns = new Map<string, number>();
  let largest = Math.abs(frameTurn);

  for (const slot of path.assignments) {
    const unit = byId.get(slot.unitId);
    if (!unit) continue;
    const { forwardAngle, travelMode } = unitFacing(unit);
    if (travelMode !== "rotate") continue;
    const turn = normalizeDegrees(
      facingRotation(startHeading, forwardAngle, !!unit.flipped) - unit.rotation
    );
    unitTurns.set(unit.id, turn);
    largest = Math.max(largest, Math.abs(turn));
  }

  return {
    groupFacing,
    frameTurn,
    unitTurns,
    largest,
    length: largest < 1e-6 ? 0 : largest / rate,
  };
}

export interface Playback {
  length: number; // the whole run in map units of playback: the turn, then the route
  pivotLength: number; // the turn's part of that
  routeLength: number; // the route's part of that
  // By overall progress through the run (0 to 1), the turn and route each getting their
  // natural share of it
  stateAt: (progress: number) => Map<string, PlaybackState>;
  // By phase: how far through the turn (0 to 1) and how far through the travel (0 to 1).
  // Until the turn is finished nobody moves, whatever `travel` says.
  stateAtPhase: (turn: number, travel: number) => Map<string, PlaybackState>;
}

// Does all the work that doesn't depend on how far through the run we are (sampling the path,
// working out the pivot and which way the path heads) once, so showing a frame is cheap.
// Build one per path and reuse it for every frame.
//
// A run is a pivot on the spot (the group does not move), then the journey, where the
// formation and turning units follow the path's heading exactly, easing in and out.
export function createPlayback(
  path: MapPath,
  units: Unit[],
  pivotRate: number = PIVOT_DEGREES_PER_UNIT
): Playback {
  const sampled = samplePath(path.points);
  if (sampled.samples.length === 0) {
    const empty = () => new Map<string, PlaybackState>();
    return {
      length: 0,
      pivotLength: 0,
      routeLength: 0,
      stateAt: empty,
      stateAtPhase: empty,
    };
  }

  const startHeading = headingAtDistance(sampled, 0);
  const pivot = pivotFor(path, units, startHeading, pivotRate);
  const travelSides = buildTravelSides(sampled);
  const total = pivot.length + sampled.length;

  const byId = new Map<string, Unit>(
    units.map((unit): [string, Unit] => [unit.id, unit])
  );
  const members = path.assignments.flatMap((slot) => {
    const unit = byId.get(slot.unitId);
    return unit ? [{ slot, unit, ...unitFacing(unit) }] : [];
  });

  const stateAtPhase = (
    turn: number,
    travel: number
  ): Map<string, PlaybackState> => {
    const result = new Map<string, PlaybackState>();

    const isPivoting = pivot.length > 0 && turn < 1;
    const turnedSoFar = isPivoting ? clamp01(turn) * pivot.largest : Infinity; // degrees
    const turnBy = (needed: number) =>
      Math.sign(needed) * Math.min(Math.abs(needed), turnedSoFar);

    // Once facing the right way, the march sets off gently, holds a steady pace, and slows
    // to a stop at the end of the route
    const distance =
      isPivoting || sampled.length === 0
        ? 0
        : sampled.length * easeTravel(travel);

    const centre = pointAtDistance(sampled, distance);
    const heading = headingAtDistance(sampled, distance);
    const travellingRight = travelSideAt(travelSides, distance);

    // The formation turns on the spot, then follows the path's heading exactly
    const frame = isPivoting
      ? (pivot.groupFacing + turnBy(pivot.frameTurn)) * DEG_TO_RAD
      : heading;

    for (const { slot, unit, forwardAngle, travelMode } of members) {
      const position = applyOffset(centre, slot, frame);

      let rotation = unit.rotation;
      let flipped = !!unit.flipped;
      if (travelMode === "rotate") {
        rotation = isPivoting
          ? unit.rotation + turnBy(pivot.unitTurns.get(unit.id) ?? 0)
          : facingRotation(heading, forwardAngle, flipped);
      } else if (travelMode === "upright") {
        flipped = artFacesRight(forwardAngle) !== travellingRight;
      }

      result.set(unit.id, { x: position.x, y: position.y, rotation, flipped });
    }
    return result;
  };

  const stateAt = (progress: number): Map<string, PlaybackState> => {
    const elapsed = clamp01(progress) * total;
    return stateAtPhase(
      pivot.length > 0 ? elapsed / pivot.length : 1,
      sampled.length > 0 ? (elapsed - pivot.length) / sampled.length : 1
    );
  };

  return {
    length: total,
    pivotLength: pivot.length,
    routeLength: sampled.length,
    stateAt,
    stateAtPhase,
  };
}

// How long a whole run takes, in map units of playback
export function playbackLength(
  path: MapPath,
  units: Unit[],
  pivotRate: number = PIVOT_DEGREES_PER_UNIT
): number {
  return createPlayback(path, units, pivotRate).length;
}

// One-off version of createPlayback(...).stateAt(...), for tests and one-time use
export function playbackState(
  path: MapPath,
  units: Unit[],
  progress: number,
  pivotRate: number = PIVOT_DEGREES_PER_UNIT
): Map<string, PlaybackState> {
  return createPlayback(path, units, pivotRate).stateAt(progress);
}
