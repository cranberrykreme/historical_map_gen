import { StateCreator } from "zustand";
import { Army, MapPath, Unit } from "../../types";
import { HistorySlice, MapStore } from "./types";

// One undo step: the whole document, so units, paths and armies move through history together
export interface Snapshot {
  units: Unit[];
  paths: MapPath[];
  armies: Army[];
}

export const snapshotOf = (state: MapStore): Snapshot => ({
  units: state.placedUnits,
  paths: state.paths,
  armies: state.armies,
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
      placedUnits: previous.units,
      paths: previous.paths,
      armies: previous.armies,
      future: [snapshotOf(state), ...state.future],
      ...reconcileSelection(state, previous.units, previous.paths),
      selectedArmyId: previous.armies.some((a) => a.id === state.selectedArmyId)
        ? state.selectedArmyId
        : null,
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    set({
      past: [...state.past, snapshotOf(state)],
      placedUnits: next.units,
      paths: next.paths,
      armies: next.armies,
      future: state.future.slice(1),
      ...reconcileSelection(state, next.units, next.paths),
      selectedArmyId: next.armies.some((a) => a.id === state.selectedArmyId)
        ? state.selectedArmyId
        : null,
    });
  },
});
