import { MapPath, Unit } from "../types";
import { changeFormationMode } from "./formation";
import { createPlayback, Playback, PlaybackState } from "./pathPlayback";

// How fast a march goes by default, in map units per second. A movement with no timing set
// lasts as long as its path takes at this pace (the same as the preview at 1x).
export const DEFAULT_PACE = 100;

// The shortest a movement can be, in seconds
export const MIN_MOVEMENT_SECONDS = 0.5;

export interface MovementTiming {
  start: number; // seconds on the video's timeline
  end: number;
}

const roundTenths = (seconds: number) => Math.round(seconds * 10) / 10;

// How long a march lasts by default, given the length of its run (pivot included)
export function defaultDuration(playbackLength: number): number {
  return Math.max(
    roundTenths(playbackLength / DEFAULT_PACE),
    MIN_MOVEMENT_SECONDS
  );
}

// Keeps a timing sensible: it can't start before 0 or be shorter than the minimum
export function clampTiming(start: number, end: number): MovementTiming {
  const safeStart = Math.max(start, 0);
  return {
    start: safeStart,
    end: Math.max(end, safeStart + MIN_MOVEMENT_SECONDS),
  };
}

// What dragging a bar on the timeline does to a movement's timing. `delta` is how far the
// pointer has moved, in seconds. Times snap to tenths of a second and stay within the view.
export function dragTiming(
  original: MovementTiming,
  delta: number,
  mode: "move" | "start" | "end",
  viewDuration: number
): MovementTiming {
  const length = original.end - original.start;

  if (mode === "move") {
    const latestStart = Math.max(viewDuration - length, 0);
    const start = Math.min(
      Math.max(roundTenths(original.start + delta), 0),
      latestStart
    );
    return { start, end: start + length };
  }

  if (mode === "start") {
    const start = Math.min(
      Math.max(roundTenths(original.start + delta), 0),
      original.end - MIN_MOVEMENT_SECONDS
    );
    return { start, end: original.end };
  }

  const earliestEnd = original.start + MIN_MOVEMENT_SECONDS;
  const end = Math.min(
    Math.max(roundTenths(original.end + delta), earliestEnd),
    Math.max(viewDuration, earliestEnd)
  );
  return { start: original.start, end };
}

// 75.3 seconds as "1:15.3"
export function formatTime(seconds: number): string {
  const tenths = Math.round(Math.max(seconds, 0) * 10);
  const minutes = Math.floor(tenths / 600);
  const rest = (tenths % 600) / 10;
  return `${minutes}:${rest.toFixed(1).padStart(4, "0")}`;
}

const isMovement = (path: MapPath) =>
  path.assignments.length > 0 && path.points.length >= 2;

interface Movement {
  id: string;
  unitIds: string[];
  playback: Playback;
  timing: MovementTiming;
}

export interface Timeline {
  duration: number; // seconds: when the last movement ends (0 when there are none)
  timings: Map<string, MovementTiming>; // each movement's timing, stored or default
  // Each movement's run as it plays on this timeline (a chained movement starts from where
  // its units arrive), for previewing one on its own
  playbacks: Map<string, Playback>;
  // The units of each movement as they stand when it begins
  standing: Map<string, Unit[]>;
  // How every unit that has started a movement should look at a moment in time. Units that
  // have not started one are left out: they stay where they were placed. `overrides` lets a
  // bar being dragged show its draft timing before it is saved.
  stateAt: (
    time: number,
    overrides?: ReadonlyMap<string, MovementTiming>
  ) => Map<string, PlaybackState>;
}

// Does the heavy work (sampling every path, working out each pivot) once. Build it when
// paths or units change, then ask it for any moment in time as often as you like.
//
// Movements are built in the order they start, so each can pick its units up where the
// earlier ones left them. A movement whose units have marched before is measured from
// where they stand when it begins, not from where they were placed.
export function createTimeline(paths: MapPath[], units: Unit[]): Timeline {
  const placed = new Map<string, Unit>(
    units.map((unit): [string, Unit] => [unit.id, unit])
  );

  const ordered = paths
    .filter(isMovement)
    .map((path, order) => ({ path, order }))
    .sort(
      (a, b) =>
        Math.max(a.path.start ?? 0, 0) - Math.max(b.path.start ?? 0, 0) ||
        a.order - b.order
    );

  const movements: Movement[] = [];
  const standing = new Map<string, Unit[]>();

  // Where a unit is at a moment in time, according to the movements built so far. They are in
  // order of start, so the last one that has begun is the one that most recently started.
  const stateOfBuilt = (
    unitId: string,
    time: number
  ): PlaybackState | undefined => {
    for (let i = movements.length - 1; i >= 0; i--) {
      const m = movements[i];
      if (m.timing.start <= time && m.unitIds.includes(unitId)) {
        const span = Math.max(
          m.timing.end - m.timing.start,
          MIN_MOVEMENT_SECONDS
        );
        return m.playback.stateAt((time - m.timing.start) / span).get(unitId);
      }
    }
    return undefined;
  };

  for (const { path } of ordered) {
    const start = Math.max(path.start ?? 0, 0);

    // The units as they stand when this movement begins: wherever the most recent earlier
    // movement leaves them, or where they were placed
    const standingUnits: Unit[] = [];
    for (const slot of path.assignments) {
      const unit = placed.get(slot.unitId);
      if (!unit) continue;
      const state = stateOfBuilt(unit.id, start);
      standingUnits.push(
        state
          ? {
              ...unit,
              x: state.x,
              y: state.y,
              rotation: state.rotation,
              flipped: state.flipped,
            }
          : unit
      );
    }

    // The formation is measured from where the units actually are when the movement begins,
    // so it never jumps, however the earlier movements are reshaped or re-timed
    const effective: MapPath = {
      ...path,
      ...changeFormationMode(
        path,
        standingUnits,
        path.direction !== undefined ? "wheel" : "keep"
      ),
    };
    const playback = createPlayback(effective, standingUnits);
    const end = Math.max(
      path.end ?? start + defaultDuration(playback.length),
      start + MIN_MOVEMENT_SECONDS
    );

    movements.push({
      id: path.id,
      unitIds: path.assignments.map((a) => a.unitId),
      playback,
      timing: { start, end },
    });
    standing.set(path.id, standingUnits);
  }

  const timings = new Map<string, MovementTiming>(
    movements.map((m): [string, MovementTiming] => [m.id, m.timing])
  );
  const playbacks = new Map<string, Playback>(
    movements.map((m): [string, Playback] => [m.id, m.playback])
  );
  const duration = movements.reduce(
    (latest, m) => Math.max(latest, m.timing.end),
    0
  );

  const stateAt = (
    time: number,
    overrides?: ReadonlyMap<string, MovementTiming>
  ): Map<string, PlaybackState> => {
    // The movement that most recently started for a unit is the one that drives it
    const driver = new Map<
      string,
      { movement: Movement; timing: MovementTiming }
    >();
    for (const movement of movements) {
      const timing = overrides?.get(movement.id) ?? movement.timing;
      if (time < timing.start) continue;
      for (const unitId of movement.unitIds) {
        const current = driver.get(unitId);
        if (!current || timing.start >= current.timing.start) {
          driver.set(unitId, { movement, timing });
        }
      }
    }

    // Work out each driving movement once, then hand every unit its own state
    const computed = new Map<Movement, Map<string, PlaybackState>>();
    const result = new Map<string, PlaybackState>();
    driver.forEach(({ movement, timing }, unitId) => {
      let states = computed.get(movement);
      if (!states) {
        const span = Math.max(timing.end - timing.start, MIN_MOVEMENT_SECONDS);
        states = movement.playback.stateAt((time - timing.start) / span);
        computed.set(movement, states);
      }
      const state = states.get(unitId);
      if (state) result.set(unitId, state);
    });
    return result;
  };

  return { duration, timings, playbacks, standing, stateAt };
}

// The same timeline for the same paths and units, so every component that asks for it
// shares one build
let lastBuild: { paths: MapPath[]; units: Unit[]; timeline: Timeline } | null =
  null;

export function getTimeline(paths: MapPath[], units: Unit[]): Timeline {
  if (lastBuild && lastBuild.paths === paths && lastBuild.units === units) {
    return lastBuild.timeline;
  }
  const timeline = createTimeline(paths, units);
  lastBuild = { paths, units, timeline };
  return timeline;
}

// Where `selected` units stand once the movements they already belong to have finished, and
// when the last of those ends (null if they have none). Pass the paths *other than* the one
// being attached to. This is how a new movement picks its units up where the old ones left them.
export function handoverUnits(
  paths: MapPath[],
  units: Unit[],
  selected: Unit[]
): { units: Unit[]; time: number | null } {
  const timeline = createTimeline(paths, units);
  const ids = new Set(selected.map((unit) => unit.id));

  let time: number | null = null;
  for (const path of paths) {
    const timing = timeline.timings.get(path.id);
    if (timing && path.assignments.some((a) => ids.has(a.unitId))) {
      time = Math.max(time ?? 0, timing.end);
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

// The movements that start from wherever an earlier movement leaves their units, rather than
// from where the units were placed. Moving the placed units must not drag these.
export function chainedPathIds(paths: MapPath[]): Set<string> {
  const movements = paths.filter(isMovement).map((path, order) => ({
    path,
    order,
    start: Math.max(path.start ?? 0, 0),
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

// Keeps every chained movement's start point at the place its units arrive (the centre of the
// units as they stand when it begins). One movement's start can change where the next one's
// units arrive, so this repeats until nothing moves. Returns the same array when nothing
// needed to change.
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

      const arrival = {
        x: mean(standing.map((unit) => unit.x)),
        y: mean(standing.map((unit) => unit.y)),
      };
      const start = path.points[0];
      if (Math.hypot(arrival.x - start.x, arrival.y - start.y) < 1e-6)
        return path;

      changed = true;
      return { ...path, points: [arrival, ...path.points.slice(1)] };
    });
    if (!changed) break;
    current = next;
  }
  return current;
}

// Where a date marker lands when it is dragged `delta` seconds: snapped to tenths and kept
// within the view
export function dragMarkerTime(
  original: number,
  delta: number,
  viewDuration: number
): number {
  return Math.min(
    Math.max(roundTenths(original + delta), 0),
    Math.max(viewDuration, 0)
  );
}
