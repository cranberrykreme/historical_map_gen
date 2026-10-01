import { create } from "zustand";
import { Unit, AssetType, MapPath, PathPoint, TravelMode } from "../types";
import {
  attachUnits,
  changeFormationMode,
  FormationMode,
  reanchorPaths,
  rerecordSlots,
} from "../utils/formation";

interface DragPosition {
  id: string;
  x: number;
  y: number;
}

interface DragRotation {
  id: string;
  rotation: number;
}

interface DragScale {
  id: string;
  scale: number;
}

interface GroupDragDelta {
  dx: number;
  dy: number;
}

// One undo step: the whole document, so units and paths always move through history together
interface Snapshot {
  units: Unit[];
  paths: MapPath[];
}

interface MapStore {
  // History
  past: Snapshot[];
  future: Snapshot[];

  // State
  placedUnits: Unit[];
  paths: MapPath[];
  selectedUnitIds: Set<string>;
  selectedPathId: string | null;
  dragPosition: DragPosition | null;
  dragRotation: DragRotation | null;
  dragScale: DragScale | null;
  groupDragDelta: GroupDragDelta | null;
  groupRotateDelta: number | null;
  groupScaleDelta: number | null;

  // History actions
  set: (units: Unit[]) => void;
  undo: () => void;
  redo: () => void;

  // Unit actions
  setPlacedUnits: (units: Unit[]) => void;
  addUnit: (path: string, assetType: AssetType) => void;
  removeSelectedUnits: () => void;
  addUnitAtPosition: (
    path: string,
    assetType: AssetType,
    x: number,
    y: number
  ) => void;
  cleanupRenamedAsset: (
    oldPath: string,
    newPath: string,
    assetType: AssetType
  ) => void;

  // Path actions (setPaths is for loading and bypasses history)
  setPaths: (paths: MapPath[]) => void;
  selectPath: (id: string | null) => void;
  addPath: (points: PathPoint[]) => string;
  updatePathPoints: (id: string, points: PathPoint[]) => void;
  renamePath: (id: string, name: string) => void;
  deletePath: (id: string) => void;

  // Selection actions
  selectUnit: (id: string | null, addToSelection?: boolean) => void;
  boxSelect: (ids: string[]) => void;

  // Cleanup when an asset is deleted elsewhere (called via useAssetStore's onDeleted callback)
  cleanupDeletedAsset: (path: string, assetType: AssetType) => void;

  // Drag actions
  setDragPosition: (drag: DragPosition | null) => void;
  setDragRotation: (drag: DragRotation | null) => void;
  setDragScale: (drag: DragScale | null) => void;
  setGroupDragDelta: (delta: GroupDragDelta | null) => void;
  setGroupRotateDelta: (delta: number | null) => void;
  setGroupScaleDelta: (delta: number | null) => void;

  // Commit actions
  commitUnitMove: (id: string, x: number, y: number) => void;
  commitUnitRotate: (id: string, rotation: number) => void;
  commitUnitScale: (id: string, scale: number) => void;
  commitGroupMove: (dx: number, dy: number) => void;
  commitGroupRotate: (delta: number) => void;
  commitGroupScale: (delta: number) => void;

  // copy/paste items
  clipboard: Unit[];
  copySelectedUnits: () => void;
  pasteUnits: () => void;

  // flip items
  flipSelectedUnits: () => void;

  // unit's forwards direction.
  setUnitForward: (unitId: string, forwardAngle: number) => void;
  setUnitsTravelMode: (unitIds: string[], mode: TravelMode) => void;
  attachSelectedUnitsToPath: (pathId: string) => boolean;
  detachUnitFromPath: (pathId: string, unitId: string) => void;
  refreshPathFormation: (pathId: string) => void;
  setFormationMode: (pathId: string, mode: FormationMode) => void;

  // Track Map files
  selectedMapFilename: string | null;
  setSelectedMap: (filename: string | null) => void;

  // reset map on new project load.
  resetMapState: () => void;
}

// Records the current document as an undo step and clears redo.
// Spread this into a set() call: set({ ...withHistory(get()), placedUnits: ... })
function withHistory(state: MapStore) {
  return {
    past: [...state.past, { units: state.placedUnits, paths: state.paths }],
    future: [] as Snapshot[],
  };
}

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

// After an undo/redo, drop any selection that points at something that no longer exists
function reconcileSelection(state: MapStore, units: Unit[], paths: MapPath[]) {
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

function nextPathName(paths: MapPath[]): string {
  const used = paths
    .map((path) => /^Path (\d+)$/.exec(path.name))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number(match[1]));
  return `Path ${used.length > 0 ? Math.max(...used) + 1 : 1}`;
}

const newPathId = () =>
  `path-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useMapStore = create<MapStore>((set, get) => ({
  // Initial history state
  past: [],
  future: [],
  clipboard: [],

  // Initial state
  placedUnits: [],
  paths: [],
  selectedUnitIds: new Set(),
  selectedPathId: null,
  dragPosition: null,
  dragRotation: null,
  dragScale: null,
  groupDragDelta: null,
  groupRotateDelta: null,
  groupScaleDelta: null,
  selectedMapFilename: null,

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
      future: [
        { units: state.placedUnits, paths: state.paths },
        ...state.future,
      ],
      ...reconcileSelection(state, previous.units, previous.paths),
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    set({
      past: [...state.past, { units: state.placedUnits, paths: state.paths }],
      placedUnits: next.units,
      paths: next.paths,
      future: state.future.slice(1),
      ...reconcileSelection(state, next.units, next.paths),
    });
  },

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
    };
    set({
      ...withHistory(state),
      placedUnits: [...state.placedUnits, newUnit],
    });
  },

  removeSelectedUnits: () => {
    const state = get();
    const remaining = state.placedUnits.filter(
      (unit) => !state.selectedUnitIds.has(unit.id)
    );
    set({
      ...withHistory(state),
      placedUnits: remaining,
      paths: keepAssignments(state.paths, new Set(remaining.map((u) => u.id))),
      selectedUnitIds: new Set(),
    });
  },

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
    set({
      ...withHistory(state),
      paths: state.paths.map((path) =>
        path.id === id
          ? {
              ...path,
              points,
              // Editing the route can change the start heading, so re-measure the formation
              // from where the units are now and nothing jumps when playback starts
              assignments: rerecordSlots(path, points, state.placedUnits),
            }
          : path
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

  // Selection actions
  selectUnit: (id, addToSelection = false) => {
    if (id === null) {
      set({ selectedUnitIds: new Set() });
      return;
    }
    if (addToSelection) {
      const next = new Set(get().selectedUnitIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      set({ selectedUnitIds: next });
    } else {
      set({ selectedUnitIds: new Set([id]) });
    }
  },

  boxSelect: (ids) => set({ selectedUnitIds: new Set(ids) }),

  // Cleanup when an asset is deleted elsewhere
  cleanupDeletedAsset: (path, assetType) => {
    const state = get();
    const usesAsset = (unit: Unit) =>
      unit.assetType === assetType && (unit.path ?? unit.filename) === path;

    // Removes the asset's units, and their formation slots, from a snapshot
    const strip = (snapshot: Snapshot): Snapshot => {
      const units = snapshot.units.filter((unit) => !usesAsset(unit));
      return {
        units,
        paths: keepAssignments(snapshot.paths, new Set(units.map((u) => u.id))),
      };
    };

    const current = strip({ units: state.placedUnits, paths: state.paths });
    const remainingIds = new Set(current.units.map((unit) => unit.id));

    set({
      placedUnits: current.units,
      paths: current.paths,
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

  // Drag actions
  setDragPosition: (drag) => set({ dragPosition: drag }),
  setDragRotation: (drag) => set({ dragRotation: drag }),
  setDragScale: (drag) => set({ dragScale: drag }),
  setGroupDragDelta: (delta) => set({ groupDragDelta: delta }),
  setGroupRotateDelta: (delta) => set({ groupRotateDelta: delta }),
  setGroupScaleDelta: (delta) => set({ groupScaleDelta: delta }),

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
      paths: reanchorPaths(state.paths, state.placedUnits, placedUnits),
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
      paths: reanchorPaths(state.paths, state.placedUnits, placedUnits),
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

    const newUnits: Unit[] = state.clipboard.map((unit) => ({
      ...unit,
      id: `${unit.filename}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      x: unit.x + 20,
      y: unit.y + 20,
    }));

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

  // Attaches the selected units to a path and records each one's place in the formation
  // (see attachUnits for how the path's start is handled). One undo step.
  attachSelectedUnitsToPath: (pathId) => {
    const state = get();
    const path = state.paths.find((p) => p.id === pathId);
    const units = state.placedUnits.filter((unit) =>
      state.selectedUnitIds.has(unit.id)
    );
    if (!path || units.length === 0) return false;

    const attachment = attachUnits(path, units);
    if (!attachment) return false;

    set({
      ...withHistory(state),
      paths: state.paths.map((p) =>
        p.id === pathId ? { ...p, ...attachment } : p
      ),
      selectedPathId: pathId,
    });
    return true;
  },

  detachUnitFromPath: (pathId, unitId) => {
    const state = get();
    set({
      ...withHistory(state),
      paths: state.paths.map((path) =>
        path.id === pathId
          ? {
              ...path,
              assignments: path.assignments.filter((a) => a.unitId !== unitId),
            }
          : path
      ),
    });
  },

  // Re-records a path's formation from where its units are, and the way they face, right now
  refreshPathFormation: (pathId) => {
    const state = get();
    const path = state.paths.find((p) => p.id === pathId);
    if (!path || path.assignments.length === 0) return;

    const ids = new Set(path.assignments.map((a) => a.unitId));
    const attachment = attachUnits(
      path,
      state.placedUnits.filter((unit) => ids.has(unit.id))
    );
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

  setSelectedMap: (filename) => set({ selectedMapFilename: filename }),

  resetMapState: () =>
    set({
      past: [],
      future: [],
      clipboard: [],
      placedUnits: [],
      paths: [],
      selectedUnitIds: new Set(),
      selectedPathId: null,
      dragPosition: null,
      dragRotation: null,
      dragScale: null,
      groupDragDelta: null,
      groupRotateDelta: null,
      groupScaleDelta: null,
      selectedMapFilename: null,
    }),

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
}));

// Development only: lets you poke at the store from the browser console,
// e.g. mapStore.getState().paths
if (process.env.NODE_ENV === "development") {
  (window as unknown as { mapStore?: typeof useMapStore }).mapStore =
    useMapStore;
}
