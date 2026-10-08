import { StateCreator } from "zustand";
import { MapPath } from "../../types";
import {
  attachUnits,
  changeFormationMode,
  reanchorPaths,
  rerecordSlots,
} from "../../utils/formation";
import {
  chainedPathIds,
  defaultMarch,
  getTimeline,
  handoverUnits,
  keepAfter,
  validMarch,
} from "../../utils/timeline";
import { clampMarch } from "../../utils/marches";
import { createPlayback } from "../../utils/pathPlayback";
import { defaultMarchStart } from "../../utils/lifespans";
import { armyForAttach, joinArmy, leaveArmy } from "../../utils/armies";
import { withHistory } from "./history";
import { MapStore, PathsSlice } from "./types";

function nextPathName(paths: MapPath[]): string {
  const used = paths
    .map((path) => /^Path (\d+)$/.exec(path.name))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number(match[1]));
  return `Path ${used.length > 0 ? Math.max(...used) + 1 : 1}`;
}

const newPathId = () =>
  `path-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const createPathsSlice: StateCreator<MapStore, [], [], PathsSlice> = (
  set,
  get
) => ({
  // Initial state
  paths: [],
  selectedPathId: null,

  // Path actions
  setPaths: (paths) => set({ paths }),

  selectPath: (id) => set({ selectedPathId: id }),

  addPath: (points) => {
    const state = get();
    const path: MapPath = {
      id: newPathId(),
      name: nextPathName(state.paths),
      points,
      assignments: [],
    };
    set({
      ...withHistory(state),
      paths: [...state.paths, path],
      selectedPathId: path.id,
    });
    return path.id;
  },

  updatePathPoints: (id, points) => {
    const state = get();
    const path = state.paths.find((p) => p.id === id);
    if (!path || points.length === 0) return;

    // Moving the start of an army's first march moves the army with it, the same way moving
    // the army moves the start. Its formation, and where it arrives, stay as they were.
    const dx = points[0].x - path.points[0].x;
    const dy = points[0].y - path.points[0].y;
    const startMoved = Math.abs(dx) > 1e-9 || Math.abs(dy) > 1e-9;
    const chained = chainedPathIds(state.paths);

    if (
      startMoved &&
      points.length === path.points.length &&
      path.assignments.length > 0 &&
      !chained.has(id)
    ) {
      const armyIds = new Set(path.assignments.map((a) => a.unitId));
      const placedUnits = state.placedUnits.map((unit) =>
        armyIds.has(unit.id)
          ? { ...unit, x: unit.x + dx, y: unit.y + dy }
          : unit
      );
      const edited = state.paths.map((p) =>
        p.id === id
          ? { ...p, points, assignments: rerecordSlots(p, points, placedUnits) }
          : p
      );
      set({
        ...withHistory(state),
        placedUnits,
        // Any other first march of the same units follows them too
        paths: reanchorPaths(
          edited,
          state.placedUnits,
          placedUnits,
          new Set([...Array.from(chained), id])
        ),
      });
      return;
    }

    set({
      ...withHistory(state),
      paths: state.paths.map((p) =>
        p.id === id
          ? {
              ...p,
              points,
              // Editing the route can change the start heading, so re-measure the formation
              // from where the units are now and nothing jumps when playback starts
              assignments: rerecordSlots(p, points, state.placedUnits),
            }
          : p
      ),
    });
  },

  renamePath: (id, name) => {
    const state = get();
    set({
      ...withHistory(state),
      paths: state.paths.map((path) =>
        path.id === id ? { ...path, name } : path
      ),
    });
  },

  deletePath: (id) => {
    const state = get();
    set({
      ...withHistory(state),
      paths: state.paths.filter((path) => path.id !== id),
      selectedPathId: state.selectedPathId === id ? null : state.selectedPathId,
    });
  },

  // Attaches the selected units to a path and records each one's place in the formation
  // (see attachUnits for how the path's start is handled). One undo step.
  //
  // Units that already march along other paths are picked up where those marches leave them,
  // and this march is dated to begin when the last of those ends. Otherwise it begins at the
  // story's start, or once the last of the units has appeared. A march that already has dates
  // keeps them.
  attachSelectedUnitsToPath: (pathId) => {
    const state = get();
    const path = state.paths.find((p) => p.id === pathId);
    const selected = state.placedUnits.filter((unit) =>
      state.selectedUnitIds.has(unit.id)
    );
    if (!path || selected.length === 0) return false;

    const others = state.paths.filter((p) => p.id !== pathId);
    const handover = handoverUnits(others, state.placedUnits, selected);

    const attachment = attachUnits(path, handover.units);
    if (!attachment) return false;

    const march =
      path.march ??
      defaultMarch(
        createPlayback({ ...path, ...attachment }, handover.units),
        defaultMarchStart(handover.time, state.storyStart, selected)
      );

    // The march belongs to the army its units are in when it sets off. Units in no army
    // become a new army; a mix of armies leaves it a plain march. A path that already
    // belongs to an army keeps it, and the selected units join that army as it sets off, so
    // they are on the march (an army's march is whoever is in the army then).
    const setsOff = march.start > state.storyStart ? march.start : undefined;
    const selectedIds = selected.map((unit) => unit.id);
    const owner = path.armyId
      ? {
          armies: joinArmy(state.armies, path.armyId, selectedIds, setsOff),
          armyId: path.armyId,
        }
      : armyForAttach(state.armies, selectedIds, setsOff);

    set({
      ...withHistory(state),
      paths: state.paths.map((p) =>
        p.id === pathId
          ? { ...p, ...attachment, march, armyId: owner.armyId }
          : p
      ),
      armies: owner.armies,
      selectedPathId: pathId,
    });
    return true;
  },

  // Takes a unit off a march. An army's march is whoever is in the army as it sets off, so
  // for one of those the unit leaves the army at that moment: it is off this march and the
  // army's later ones, and stays wherever the earlier ones left it. One undo step.
  detachUnitFromPath: (pathId, unitId) => {
    const state = get();
    const path = state.paths.find((p) => p.id === pathId);
    if (!path) return;
    const army = path.armyId
      ? state.armies.find((a) => a.id === path.armyId)
      : undefined;
    const march = validMarch(path.march);
    const setsOff =
      march && march.start > state.storyStart ? march.start : undefined;
    set({
      ...withHistory(state),
      armies: army
        ? leaveArmy(state.armies, army.id, [unitId], setsOff)
        : state.armies,
      paths: state.paths.map((p) =>
        p.id === pathId
          ? {
              ...p,
              assignments: p.assignments.filter((a) => a.unitId !== unitId),
            }
          : p
      ),
    });
  },

  // Re-records a path's formation from where its units stand when the march begins (where
  // they were placed, or where an earlier march leaves them), and the way they face then
  refreshPathFormation: (pathId) => {
    const state = get();
    const path = state.paths.find((p) => p.id === pathId);
    if (!path || path.assignments.length === 0) return;

    const standing = getTimeline(state.paths, state.placedUnits).standing.get(
      pathId
    );
    if (!standing) return;
    const attachment = attachUnits(path, standing);
    if (!attachment) return;

    set({
      ...withHistory(state),
      paths: state.paths.map((p) =>
        p.id === pathId ? { ...p, ...attachment } : p
      ),
    });
  },

  // Switches a path between keeping its formation as placed and turning it with its units.
  // Nobody moves; the slots are re-measured. One undo step.
  setFormationMode: (pathId, mode) => {
    const state = get();
    const path = state.paths.find((p) => p.id === pathId);
    if (!path || path.assignments.length === 0) return;

    const change = changeFormationMode(path, state.placedUnits, mode);
    set({
      ...withHistory(state),
      paths: state.paths.map((p) =>
        p.id === pathId ? { ...p, ...change } : p
      ),
    });
  },

  // When a march happens in history. It can't begin before the story starts. One undo step.
  setMarchTiming: (pathId, timing) => {
    const state = get();
    if (!state.paths.some((p) => p.id === pathId)) return;
    const march = keepAfter(clampMarch(timing), state.storyStart, true);
    set({
      ...withHistory(state),
      paths: state.paths.map((p) => (p.id === pathId ? { ...p, march } : p)),
    });
  },
});
