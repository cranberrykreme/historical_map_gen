import { MapPath, PathPoint, Unit } from "../../types";
import { HistoryTime } from "../historyTime";
import { createTimeline, getTimeline, isMovement, marchStart } from "./engine";

// Where `selected` units stand once the marches they already belong to have finished, and
// when the last of those ends (null if they have none). Pass the paths *other than* the one
// being attached to. This is how a new march picks its units up where the old ones left them.
export function handoverUnits(
  paths: MapPath[],
  units: Unit[],
  selected: Unit[]
): { units: Unit[]; time: HistoryTime | null } {
  const timeline = createTimeline(paths, units);
  const ids = new Set(selected.map((unit) => unit.id));

  let time: HistoryTime | null = null;
  for (const path of paths) {
    const timing = timeline.timings.get(path.id);
    if (timing && path.assignments.some((a) => ids.has(a.unitId))) {
      time = time === null ? timing.end : Math.max(time, timing.end);
    }
  }
  if (time === null) return { units: selected, time: null };

  const states = timeline.stateAt(time);
  return {
    units: selected.map((unit) => {
      const state = states.get(unit.id);
      return state
        ? {
            ...unit,
            x: state.x,
            y: state.y,
            rotation: state.rotation,
            flipped: state.flipped,
          }
        : unit;
    }),
    time,
  };
}

// The marches that start from wherever an earlier march leaves their units, rather than from
// where the units were placed. Moving the placed units must not drag these.
export function chainedPathIds(paths: MapPath[]): Set<string> {
  const movements = paths.filter(isMovement).map((path, order) => ({
    path,
    order,
    start: marchStart(path),
  }));

  const chained = new Set<string>();
  for (const m of movements) {
    const hasEarlier = movements.some(
      (other) =>
        other !== m &&
        (other.start < m.start ||
          (other.start === m.start && other.order < m.order)) &&
        other.path.assignments.some((a) =>
          m.path.assignments.some((b) => b.unitId === a.unitId)
        )
    );
    if (hasEarlier) chained.add(m.path.id);
  }
  return chained;
}

const mean = (values: number[]) =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

// The army march just before this one: the latest-starting earlier march of the same army
// that has units. Undefined for a march in no army, or an army's first march.
function previousArmyMarch(
  path: MapPath,
  paths: MapPath[]
): MapPath | undefined {
  if (!path.armyId) return undefined;
  const order = (p: MapPath) => paths.indexOf(p);
  const start = marchStart(path);
  let best: MapPath | undefined;
  for (const other of paths) {
    if (other === path || other.armyId !== path.armyId || !isMovement(other))
      continue;
    const otherStart = marchStart(other);
    const earlier =
      otherStart < start ||
      (otherStart === start && order(other) < order(path));
    if (!earlier) continue;
    if (
      !best ||
      otherStart > marchStart(best) ||
      (otherStart === marchStart(best) && order(other) > order(best))
    ) {
      best = other;
    }
  }
  return best;
}

// Where an army's previous march ends: the last point of its route. The army's centre
// follows its route from march to march, so units joining or leaving it along the way never
// move where it goes next. Undefined when the march isn't an army's, or is its army's first.
function armyArrival(path: MapPath, paths: MapPath[]): PathPoint | undefined {
  const previous = previousArmyMarch(path, paths);
  return previous ? previous.points[previous.points.length - 1] : undefined;
}

// Keeps every chained march's start point at the place its units arrive:
// - an army's march starts where the army's previous march ends, so units joining or leaving
//   the army along the way never move it (each unit keeps its own place relative to the route)
// - any other chained march starts at the centre of its units as they stand when it begins
// One march's start can change where the next one's units arrive, so this repeats until
// nothing moves. Returns the same array when nothing needed to change.
export function syncChainedStarts(paths: MapPath[], units: Unit[]): MapPath[] {
  let current = paths;
  for (let pass = 0; pass <= paths.length; pass++) {
    const chained = chainedPathIds(current);
    if (chained.size === 0) break;
    const timeline = getTimeline(current, units);

    let changed = false;
    const next = current.map((path) => {
      const standing = timeline.standing.get(path.id);
      if (!chained.has(path.id) || !standing || standing.length === 0)
        return path;

      const arrival = armyArrival(path, current) ?? {
        x: mean(standing.map((unit) => unit.x)),
        y: mean(standing.map((unit) => unit.y)),
      };
      const start = path.points[0];
      if (Math.hypot(arrival.x - start.x, arrival.y - start.y) < 1e-6)
        return path;

      changed = true;
      return {
        ...path,
        points: [{ x: arrival.x, y: arrival.y }, ...path.points.slice(1)],
      };
    });
    if (!changed) break;
    current = next;
  }
  return current;
}
