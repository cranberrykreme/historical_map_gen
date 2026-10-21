// Leaving: where a unit is, and which way it faces, as it leaves

import { Unit } from "../../types";
import { HistoryTime } from "../history/historyTime";
import { Timeline } from "../history/timeline";
import { unitAt } from "./blocks";
import { exitSeconds } from "./exitStyles";

export interface Place {
  x: number;
  y: number;
  rotation: number;
  flipped: boolean;
}

const placeCache = new WeakMap<Timeline, Map<string, Place>>();

// Where a unit is as it leaves: wherever its marches had taken it then, or where it was placed.
// Worked out once per timeline.
export function leavingPlace(timeline: Timeline, unit: Unit): Place {
  let cache = placeCache.get(timeline);
  if (!cache) {
    cache = new Map();
    placeCache.set(timeline, cache);
  }
  const key = `${unit.id}@${unit.leaves}`;
  const known = cache.get(key);
  if (known) return known;
  const state =
    unit.leaves !== undefined
      ? timeline.stateAt(unit.leaves).get(unit.id)
      : undefined;
  const place: Place = state
    ? {
        x: state.x,
        y: state.y,
        rotation: state.rotation,
        flipped: state.flipped,
      }
    : {
        x: unit.x,
        y: unit.y,
        rotation: unit.rotation,
        flipped: !!unit.flipped,
      };
  cache.set(key, place);
  return place;
}

// How wide a unit's picture is at scale 1, in map units. The same as the editor's unit layer
// and the renderer's UNIT_WIDTH.
export const UNIT_IMAGE_WIDTH = 48;

// A unit leaving at a moment: where it stands (as it was when it left, its block thinned as it
// was then), and how far through its animation it is (0 to 1)
export interface Leaving {
  unit: Unit;
  progress: number;
  age: number; // seconds of video since it left
}

// The units part way through leaving at a moment. `ageOf` says how many seconds of video ago
// a unit left (see videoExitAge and historyExitAge).
export function leavingAt(
  units: Unit[],
  timeline: Timeline,
  moment: HistoryTime,
  ageOf: (unit: Unit) => number | null
): Leaving[] {
  const out: Leaving[] = [];
  for (const unit of units) {
    if (!unit.exit || unit.leaves === undefined || moment < unit.leaves)
      continue;
    if ((unit.appears ?? -Infinity) > unit.leaves) continue;
    const age = ageOf(unit) ?? Infinity;
    const progress = age / exitSeconds(unit.exit);
    if (!(progress < 1)) continue;
    const place = leavingPlace(timeline, unit);
    out.push({
      unit: unitAt({ ...unit, ...place }, unit.leaves),
      progress,
      age,
    });
  }
  return out;
}
