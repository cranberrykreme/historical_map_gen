import { AssetType, TravelMode, Unit } from "../types";

export interface UnitFacing {
  forwardAngle: number;
  travelMode: TravelMode;
}

// Art faces up by default (-90° in screen angles, where 0 is right and 90 is down)
export const DEFAULT_FORWARD_ANGLE = -90;

export function defaultTravelMode(
  assetType: AssetType | undefined
): TravelMode {
  return assetType === "portraits" ? "upright" : "rotate";
}

// Defaults: units turn to face their direction of travel; portraits stay upright
// (mirroring instead) so a face is never upside down
export function unitFacing(unit: Unit): UnitFacing {
  return {
    forwardAngle: unit.forwardAngle ?? DEFAULT_FORWARD_ANGLE,
    travelMode: unit.travelMode ?? defaultTravelMode(unit.assetType),
  };
}

// Wraps any angle into (-180, 180]
export function normalizeDegrees(angle: number): number {
  let wrapped = ((angle % 360) + 360) % 360;
  if (wrapped > 180) wrapped -= 360;
  return wrapped;
}

const SNAP_STEP = 45;
const SNAP_WINDOW = 6;

// Snaps to the nearest 45° when within a few degrees of it
export function snapDegrees(angle: number): number {
  const nearest = Math.round(angle / SNAP_STEP) * SNAP_STEP;
  return Math.abs(angle - nearest) <= SNAP_WINDOW
    ? normalizeDegrees(nearest)
    : angle;
}

// The direction the front points in the unit's own (unrotated) space.
// Mirroring flips the image horizontally, which turns an angle a into 180 - a.
export function effectiveForward(
  forwardAngle: number,
  flipped: boolean
): number {
  return flipped ? 180 - forwardAngle : forwardAngle;
}

// Turns a pointer position (relative to the unit's centre, in screen pixels) into the
// stored forwards angle, allowing for the unit's rotation and mirroring
export function forwardFromPointer(
  dx: number,
  dy: number,
  unitRotationDeg: number,
  flipped: boolean
): number {
  const screenAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  const local = screenAngle - unitRotationDeg;
  const stored = flipped ? 180 - local : local;
  return snapDegrees(normalizeDegrees(stored));
}
