import { StateCreator } from "zustand";
import { Unit, AssetType, MapPath } from "../../types";
import { reanchorPaths } from "../../utils/formation";
import { chainedPathIds } from "../../utils/timeline";
import { HistoryTime } from "../../utils/historyTime";
import { placementMoment, removeUnitsAt } from "../../utils/lifespans";
import { forgetUnits } from "../../utils/armies";
import { useTimelineStore } from "../useTimelineStore";
import { Snapshot, snapshotOf, withHistory } from "./history";
import { MapStore, UnitsSlice } from "./types";

// Keeps only the formation slots whose unit still exists
function keepAssignments(
  paths: MapPath[],
  keepUnitIds: Set<string>
): MapPath[] {
  return paths.map((path) => ({
    ...path,
    assignments: path.assignments.filter((a) => keepUnitIds.has(a.unitId)),
  }));
}

// A new unit starts with the facing and travel mode of the most recently placed unit made
// from the same asset, so they only need setting once. After that each unit is independent.
function inheritedFacing(units: Unit[], path: string, assetType: AssetType) {
  const sameAsset = [...units]
    .reverse()
    .filter(
      (unit) =>
        unit.assetType === assetType && (unit.path ?? unit.filename) === path
    );
  return {
    forwardAngle: sameAsset.find((unit) => unit.forwardAngle !== undefined)
      ?.forwardAngle,
    travelMode: sameAsset.find((unit) => unit.travelMode !== undefined)
      ?.travelMode,
  };
}

// When a unit placed right now appears: at the playhead once it is past the story's start,
// otherwise it is there from the start (no date)
function appearsNow(storyStart: HistoryTime): { appears?: number } {
  const appears = placementMoment(useTimelineStore.getState().now, storyStart);
  return appears === undefined ? {} : { appears };
}

export const createUnitsSlice: StateCreator<MapStore, [], [], UnitsSlice> = (
  set,
  get
) => ({
  clipboard: [],

  // Initial state
  placedUnits: [],

  // Unit actions — setPlacedUnits bypasses history (for loading)
  setPlacedUnits: (units) => set({ placedUnits: units }),

  addUnit: (path, assetType) => {
    const state = get();
    const filename = path.split("/").pop() ?? path;
    const newUnit: Unit = {
      id: `${filename}-${Date.now()}`,
      filename,
      path,
      assetType,
      x: 100,
      y: 100,
      rotation: 0,
      scale: 1,
      ...inheritedFacing(state.placedUnits, path, assetType),
      ...appearsNow(state.storyStart),
    };
    set({
      ...withHistory(state),
      placedUnits: [...state.placedUnits, newUnit],
    });
  },

  // At a unit's own moment (the story's start, or when it appears) deleting removes it
  // outright. Anywhere later it leaves at the playhead's moment and stays in history before.
  removeSelectedUnits: () => {
    const state = get();
    if (state.selectedUnitIds.size === 0) return;
    const { units, deletedIds } = removeUnitsAt(
      state.placedUnits,
      state.selectedUnitIds,
      useTimelineStore.getState().now,
      state.storyStart
    );
    set({
      ...withHistory(state),
      placedUnits: units,
      // Units that only leave keep their places in their marches
      paths:
        deletedIds.size > 0
          ? keepAssignments(state.paths, new Set(units.map((u) => u.id)))
          : state.paths,
      // Deleted units are forgotten by their armies; units that only leave stay in them
      armies: forgetUnits(state.armies, deletedIds),
      selectedUnitIds: new Set(),
    });
  },

  // Cleanup when an asset is deleted elsewhere
  cleanupDeletedAsset: (path, assetType) => {
    const state = get();
    const usesAsset = (unit: Unit) =>
      unit.assetType === assetType && (unit.path ?? unit.filename) === path;

    // Removes the asset's units, and their formation slots, from a snapshot
    const strip = (snapshot: Snapshot): Snapshot => {
      const units = snapshot.units.filter((unit) => !usesAsset(unit));
      const gone = new Set(
        snapshot.units.filter(usesAsset).map((unit) => unit.id)
      );
      return {
        ...snapshot,
        units,
        paths: keepAssignments(snapshot.paths, new Set(units.map((u) => u.id))),
        armies: forgetUnits(snapshot.armies, gone),
      };
    };

    const current = strip(snapshotOf(state));
    const remainingIds = new Set(current.units.map((unit) => unit.id));

    set({
      placedUnits: current.units,
      paths: current.paths,
      armies: current.armies,
      past: state.past.map(strip),
      future: state.future.map(strip),
      selectedUnitIds: new Set(
        Array.from(state.selectedUnitIds).filter((id) => remainingIds.has(id))
      ),
    });

    if (assetType === "maps" && get().selectedMapFilename === path) {
      set({ selectedMapFilename: null });
    }
  },

  // Commit actions — all go through history
  commitUnitMove: (id, x, y) => {
    const state = get();
    const placedUnits = state.placedUnits.map((unit) =>
      unit.id === id ? { ...unit, x, y } : unit
    );
    set({
      ...withHistory(state),
      dragPosition: null,
      placedUnits,
      // Attached units that moved keep their place in the formation (see reanchorPaths)
      paths: reanchorPaths(
        state.paths,
        state.placedUnits,
        placedUnits,
        chainedPathIds(state.paths)
      ),
    });
  },

  commitUnitRotate: (id, rotation) => {
    const state = get();
    set({
      ...withHistory(state),
      dragRotation: null,
      placedUnits: state.placedUnits.map((unit) =>
        unit.id === id ? { ...unit, rotation } : unit
      ),
    });
  },

  commitUnitScale: (id, scale) => {
    const state = get();
    set({
      ...withHistory(state),
      dragScale: null,
      placedUnits: state.placedUnits.map((unit) =>
        unit.id === id ? { ...unit, scale } : unit
      ),
    });
  },

  commitGroupMove: (dx, dy) => {
    const state = get();
    const placedUnits = state.placedUnits.map((unit) =>
      state.selectedUnitIds.has(unit.id)
        ? { ...unit, x: unit.x + dx, y: unit.y + dy }
        : unit
    );
    set({
      ...withHistory(state),
      groupDragDelta: null,
      placedUnits,
      paths: reanchorPaths(
        state.paths,
        state.placedUnits,
        placedUnits,
        chainedPathIds(state.paths)
      ),
    });
  },

  commitGroupRotate: (delta) => {
    const state = get();
    set({
      ...withHistory(state),
      groupRotateDelta: null,
      placedUnits: state.placedUnits.map((unit) =>
        state.selectedUnitIds.has(unit.id)
          ? { ...unit, rotation: unit.rotation + delta }
          : unit
      ),
    });
  },

  commitGroupScale: (delta) => {
    const state = get();
    set({
      ...withHistory(state),
      groupScaleDelta: null,
      placedUnits: state.placedUnits.map((unit) =>
        state.selectedUnitIds.has(unit.id)
          ? { ...unit, scale: Math.min(Math.max(unit.scale + delta, 0.1), 5) }
          : unit
      ),
    });
  },

  addUnitAtPosition: (path, assetType, x, y) => {
    const state = get();
    const filename = path.split("/").pop() ?? path;
    const newUnit: Unit = {
      id: `${filename}-${Date.now()}`,
      filename,
      path,
      assetType,
      x,
      y,
      rotation: 0,
      scale: 1,
      ...inheritedFacing(state.placedUnits, path, assetType),
      ...appearsNow(state.storyStart),
    };
    set({
      ...withHistory(state),
      placedUnits: [...state.placedUnits, newUnit],
    });
  },

  copySelectedUnits: () => {
    const { placedUnits, selectedUnitIds } = get();
    const copied = placedUnits.filter((unit) => selectedUnitIds.has(unit.id));
    set({ clipboard: copied });
  },

  pasteUnits: () => {
    const state = get();
    if (state.clipboard.length === 0) return;

    // Pasted units appear at the playhead's moment, like any other newly placed unit
    const newUnits: Unit[] = state.clipboard.map(
      ({ appears: _appears, leaves: _leaves, ...unit }) => ({
        ...unit,
        id: `${unit.filename}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        x: unit.x + 20,
        y: unit.y + 20,
        ...appearsNow(state.storyStart),
      })
    );

    set({
      ...withHistory(state),
      placedUnits: [...state.placedUnits, ...newUnits],
      selectedUnitIds: new Set(newUnits.map((u) => u.id)),
    });
  },

  flipSelectedUnits: () => {
    const state = get();
    if (state.selectedUnitIds.size === 0) return;
    set({
      ...withHistory(state),
      placedUnits: state.placedUnits.map((unit) =>
        state.selectedUnitIds.has(unit.id)
          ? { ...unit, flipped: !unit.flipped }
          : unit
      ),
    });
  },

  // Sets which way one unit's art faces (one undo step)
  setUnitForward: (unitId, forwardAngle) => {
    const state = get();
    if (!state.placedUnits.some((unit) => unit.id === unitId)) return;
    set({
      ...withHistory(state),
      placedUnits: state.placedUnits.map((unit) =>
        unit.id === unitId ? { ...unit, forwardAngle } : unit
      ),
    });
  },

  setUnitsTravelMode: (unitIds, mode) => {
    const state = get();
    const ids = new Set(unitIds);
    if (!state.placedUnits.some((unit) => ids.has(unit.id))) return;
    set({
      ...withHistory(state),
      placedUnits: state.placedUnits.map((unit) =>
        ids.has(unit.id) ? { ...unit, travelMode: mode } : unit
      ),
    });
  },

  // Undoes a unit leaving: it stays until the end of the story again. One undo step.
  bringBackUnits: (unitIds) => {
    const state = get();
    const ids = new Set(unitIds);
    const anyLeaving = state.placedUnits.some(
      (unit) => ids.has(unit.id) && unit.leaves !== undefined
    );
    if (!anyLeaving) return;
    set({
      ...withHistory(state),
      placedUnits: state.placedUnits.map((unit) => {
        if (!ids.has(unit.id) || unit.leaves === undefined) return unit;
        const { leaves: _left, ...back } = unit;
        return back;
      }),
    });
  },

  cleanupRenamedAsset: (oldPath, newPath, assetType) => {
    const { placedUnits } = get();
    const newFilename = newPath.split("/").pop() ?? newPath;
    const updatedUnits = placedUnits.map((unit) =>
      unit.path === oldPath && unit.assetType === assetType
        ? { ...unit, path: newPath, filename: newFilename }
        : unit
    );
    set({ placedUnits: updatedUnits });
  },
});
