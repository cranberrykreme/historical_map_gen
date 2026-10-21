import { StateCreator } from "zustand";
import { Army, Battle, MapPath, SceneContent, Shot, Unit } from "../../types";
import { allScenes, existingScene, openScene } from "../../utils/scenes/scenes";
import { HistorySlice, MapStore } from "./types";

// One undo step: the whole document, so units, paths, armies and shots move through history
// together. It holds every scene (the one being edited, as units/paths/armies, and the others
// in the stash), so undoing never loses or mixes up what's in another scene.
export interface Snapshot {
  units: Unit[];
  paths: MapPath[];
  armies: Army[];
  shots: Shot[];
  scene: string; // which scene the units, paths and armies belong to
  stash: Record<string, SceneContent>;
  battles: Battle[];
}

export const snapshotOf = (state: MapStore): Snapshot => ({
  units: state.placedUnits,
  paths: state.paths,
  armies: state.armies,
  shots: state.shots,
  scene: state.activeSceneId,
  stash: state.sceneStash,
  battles: state.battles,
});

// Records the current document as an undo step and clears redo.
// Spread this into a set() call: set({ ...withHistory(get()), placedUnits: ... })
export function withHistory(state: MapStore) {
  return {
    past: [...state.past, snapshotOf(state)],
    future: [] as Snapshot[],
  };
}

// After an undo/redo, drop any selection that points at something that no longer exists
export function reconcileSelection(
  state: MapStore,
  units: Unit[],
  paths: MapPath[]
) {
  const unitIds = new Set(units.map((unit) => unit.id));
  return {
    selectedUnitIds: new Set(
      Array.from(state.selectedUnitIds).filter((id) => unitIds.has(id))
    ),
    selectedPathId: paths.some((path) => path.id === state.selectedPathId)
      ? state.selectedPathId
      : null,
  };
}

// The document as it was at a snapshot, opened at the scene being edited now (or the main
// map, if undoing takes away the battle that's open)
function restore(state: MapStore, snapshot: Snapshot) {
  const scene = existingScene(state.activeSceneId, snapshot.battles);
  const { content, stash } = openScene(
    allScenes({
      activeSceneId: snapshot.scene,
      sceneStash: snapshot.stash,
      placedUnits: snapshot.units,
      paths: snapshot.paths,
      armies: snapshot.armies,
    }),
    scene
  );
  return {
    placedUnits: content.units,
    paths: content.paths,
    armies: content.armies,
    shots: snapshot.shots,
    battles: snapshot.battles,
    activeSceneId: scene,
    sceneStash: stash,
    ...reconcileSelection(state, content.units, content.paths),
    selectedArmyId: content.armies.some((a) => a.id === state.selectedArmyId)
      ? state.selectedArmyId
      : null,
    selectedShotId: snapshot.shots.some((s) => s.id === state.selectedShotId)
      ? state.selectedShotId
      : null,
  };
}

export const createHistorySlice: StateCreator<
  MapStore,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  // Initial history state
  past: [],
  future: [],

  // History actions
  set: (newUnits) => {
    set({ ...withHistory(get()), placedUnits: newUnits });
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    const previous = state.past[state.past.length - 1];
    set({
      past: state.past.slice(0, -1),
      future: [snapshotOf(state), ...state.future],
      ...restore(state, previous),
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    set({
      past: [...state.past, snapshotOf(state)],
      future: state.future.slice(1),
      ...restore(state, next),
    });
  },
});
