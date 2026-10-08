import { MapPath, Unit } from "../../types";
import { changeFormationMode } from "../formation";
import { HistoryTime, HOUR, MINUTE } from "../historyTime";
import { clampMarch, defaultTurn, MarchTiming, marchPhase } from "../marches";
import { createPlayback, Playback, PlaybackState } from "../pathPlayback";

// How fast a march goes by default, in map units per day, its turn on the spot counted the
// same way. Played at one day per second, a march moves as fast as the path preview at 1x.
export const DEFAULT_MARCH_PACE = 100;

// The shortest a new march is by default
export const MIN_DEFAULT_MARCH = HOUR;

// Where a march with no date sits. The store dates every march when units are attached and
// old projects are dated when they load, so this is only a fallback.
export const UNDATED_START = 0;

// A new march starting at `start`: as long as its run takes at the default pace (to the
// nearest minute), with the turn taking its natural share
export function defaultMarch(
  playback: Playback,
  start: HistoryTime
): MarchTiming {
  const length = Number.isFinite(playback.length) ? playback.length : 0;
  const days = Math.max(
    Math.round(length / DEFAULT_MARCH_PACE / MINUTE) * MINUTE,
    MIN_DEFAULT_MARCH
  );
  const end = start + days;
  const turn = defaultTurn(playback, start, end);
  return clampMarch({ start, end, turn: Number.isFinite(turn) ? turn : 0 });
}

// A march's stored dates, if they are usable. Anything missing or not a real number (which
// would draw nothing and sort unpredictably) counts as no dates.
export function validMarch(
  march: MarchTiming | undefined
): MarchTiming | undefined {
  if (!march) return undefined;
  const { start, end, turn } = march;
  if (![start, end].every(Number.isFinite)) return undefined;
  return clampMarch({ start, end, turn: Number.isFinite(turn) ? turn : 0 });
}

// Keeps a march from starting before `earliest` (the story's start). Moving a whole march
// shifts it; dragging its start just stops there.
export function keepAfter(
  timing: MarchTiming,
  earliest: HistoryTime,
  keepLength: boolean
): MarchTiming {
  if (timing.start >= earliest) return timing;
  if (keepLength) {
    const shift = earliest - timing.start;
    return { ...timing, start: earliest, end: timing.end + shift };
  }
  return clampMarch({ ...timing, start: earliest });
}

// Whether a unit exists at a moment in history
export function existsAt(
  unit: Pick<Unit, "appears" | "leaves">,
  t: HistoryTime
): boolean {
  return (unit.appears ?? -Infinity) <= t && t < (unit.leaves ?? Infinity);
}

// Whether a path is a march: it has units and a route to follow
export const isMovement = (path: MapPath) =>
  path.assignments.length > 0 && path.points.length >= 2;
// When a march begins, or the fallback for one with no usable dates
export const marchStart = (path: MapPath) =>
  validMarch(path.march)?.start ?? UNDATED_START;

interface Movement {
  id: string;
  unitIds: string[];
  playback: Playback;
  timing: MarchTiming;
}

export interface Timeline {
  start: HistoryTime | null; // when the first march begins (null when there are none)
  end: HistoryTime | null; // when the last march ends (null when there are none)
  timings: Map<string, MarchTiming>; // each march's dates
  // Each march's run as it plays (a chained march starts from where its units arrive), for
  // previewing one on its own
  playbacks: Map<string, Playback>;
  // The units of each march as they stand when it begins
  standing: Map<string, Unit[]>;
  // How every unit that has started a march looks at a moment in history. Units that have not
  // started one are left out: they stay where they were placed. `overrides` lets a bar being
  // dragged show its draft dates before they are saved.
  stateAt: (
    time: HistoryTime,
    overrides?: ReadonlyMap<string, MarchTiming>
  ) => Map<string, PlaybackState>;
}

const stateDuring = (
  movement: Movement,
  timing: MarchTiming,
  time: HistoryTime
) => {
  const phase = marchPhase(timing, time);
  return movement.playback.stateAtPhase(phase.turn, phase.travel);
};

// Does the heavy work (sampling every path, working out each pivot) once. Build it when
// paths or units change, then ask it for any moment in history as often as you like.
//
// Marches are built in the order they start, so each can pick its units up where the earlier
// ones left them. A march whose units have marched before is measured from where they stand
// when it begins, not from where they were placed.
export function createTimeline(paths: MapPath[], units: Unit[]): Timeline {
  const placed = new Map<string, Unit>(
    units.map((unit): [string, Unit] => [unit.id, unit])
  );

  const ordered = paths
    .filter(isMovement)
    .map((path, order) => ({ path, order }))
    .sort(
      (a, b) => marchStart(a.path) - marchStart(b.path) || a.order - b.order
    );

  const movements: Movement[] = [];
  const standing = new Map<string, Unit[]>();

  // Where a unit is at a moment, according to the marches built so far. They are in order of
  // start, so the last one that has begun is the one that most recently started.
  const stateOfBuilt = (
    unitId: string,
    time: HistoryTime
  ): PlaybackState | undefined => {
    for (let i = movements.length - 1; i >= 0; i--) {
      const m = movements[i];
      if (m.timing.start <= time && m.unitIds.includes(unitId)) {
        return stateDuring(m, m.timing, time).get(unitId);
      }
    }
    return undefined;
  };

  for (const { path } of ordered) {
    const start = marchStart(path);

    // The units as they stand when this march begins: wherever the most recent earlier march
    // leaves them, or where they were placed
    const standingUnits: Unit[] = [];
    const arrived: Unit[] = []; // those an earlier march brought here
    for (const slot of path.assignments) {
      const unit = placed.get(slot.unitId);
      if (!unit) continue;
      const state = stateOfBuilt(unit.id, start);
      const standingUnit = state
        ? {
            ...unit,
            x: state.x,
            y: state.y,
            rotation: state.rotation,
            flipped: state.flipped,
          }
        : unit;
      standingUnits.push(standingUnit);
      if (state) arrived.push(standingUnit);
    }

    // The formation is measured from where the units actually are when the march begins, so
    // it never jumps, however the earlier marches are reshaped or re-dated. A formation that
    // turns with its units faces the way the arriving units face, so a unit joining from
    // elsewhere doesn't swing the whole group round.
    const effective: MapPath = {
      ...path,
      ...changeFormationMode(
        path,
        standingUnits,
        path.direction !== undefined ? "wheel" : "keep",
        arrived
      ),
    };
    const playback = createPlayback(effective, standingUnits);
    const timing = validMarch(path.march) ?? defaultMarch(playback, start);

    movements.push({
      id: path.id,
      unitIds: path.assignments.map((a) => a.unitId),
      playback,
      timing,
    });
    standing.set(path.id, standingUnits);
  }

  const timings = new Map<string, MarchTiming>(
    movements.map((m): [string, MarchTiming] => [m.id, m.timing])
  );
  const playbacks = new Map<string, Playback>(
    movements.map((m): [string, Playback] => [m.id, m.playback])
  );
  const first =
    movements.length > 0
      ? Math.min(...movements.map((m) => m.timing.start))
      : null;
  const last =
    movements.length > 0
      ? Math.max(...movements.map((m) => m.timing.end))
      : null;

  const stateAt = (
    time: HistoryTime,
    overrides?: ReadonlyMap<string, MarchTiming>
  ): Map<string, PlaybackState> => {
    // The march that most recently started for a unit is the one that drives it
    const driver = new Map<
      string,
      { movement: Movement; timing: MarchTiming }
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

    // Work out each driving march once, then hand every unit its own state
    const computed = new Map<Movement, Map<string, PlaybackState>>();
    const result = new Map<string, PlaybackState>();
    driver.forEach(({ movement, timing }, unitId) => {
      let states = computed.get(movement);
      if (!states) {
        states = stateDuring(movement, timing, time);
        computed.set(movement, states);
      }
      const state = states.get(unitId);
      if (state) result.set(unitId, state);
    });
    return result;
  };

  return { start: first, end: last, timings, playbacks, standing, stateAt };
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
