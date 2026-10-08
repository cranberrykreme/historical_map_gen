import { create } from "zustand";
import {
  Army,
  ArmyMember,
  Unit,
  AssetType,
  HistoryDisplay,
  MapPath,
  MarchTiming,
  PacingKey,
  PathPoint,
  TravelMode,
} from "../types";
import {
  attachUnits,
  changeFormationMode,
  FormationMode,
  reanchorPaths,
  rerecordSlots,
} from "../utils/formation";
import {
  chainedPathIds,
  defaultMarch,
  existsAt,
  getTimeline,
  handoverUnits,
  keepAfter,
  syncChainedStarts,
  validMarch,
} from "../utils/timeline";
import { clampMarch } from "../utils/marches";
import { createPlayback } from "../utils/pathPlayback";
import { DEFAULT_STORY_START } from "../utils/convertProject";
import { HistoryTime } from "../utils/historyTime";
import {
  defaultMarchStart,
  placementMoment,
  removeUnitsAt,
} from "../utils/lifespans";
import { useTimelineStore } from "./useTimelineStore";
import {
  armyForAttach,
  forgetUnits,
  joinArmy,
  leaveArmy,
  membersAt,
  newArmyId,
  nextArmyName,
  syncArmyMarches,
} from "../utils/armies";

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

// One undo step: the whole document, so units, paths and armies move through history together
interface Snapshot {
  units: Unit[];
  paths: MapPath[];
  armies: Army[];
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
  setUnitForward: (unitId: string, forwardAngle: number) => void;
  setUnitsTravelMode: (unitIds: string[], mode: TravelMode) => void;
  attachSelectedUnitsToPath: (pathId: string) => boolean;
  detachUnitFromPath: (pathId: string, unitId: string) => void;
  refreshPathFormation: (pathId: string) => void;
  setFormationMode: (pathId: string, mode: FormationMode) => void;
  setMarchTiming: (pathId: string, timing: MarchTiming) => void;
  bringBackUnits: (unitIds: string[]) => void;

  // The story in history. The placed units stand as they are at `storyStart`. These load
  // with the project and bypass undo.
  storyStart: HistoryTime;
  displayMode: HistoryDisplay;
  pacing: PacingKey[]; // from older projects' date markers, for the first shot later
  setStoryStart: (storyStart: HistoryTime) => void;
  setDisplayMode: (mode: HistoryDisplay) => void;
  setPacing: (pacing: PacingKey[]) => void;

  // Armies (setArmies is for loading and bypasses history). Joining and leaving happen at the
  // playhead's moment, or from the start when the playhead is at the story's start.
  armies: Army[];
  selectedArmyId: string | null;
  setArmies: (armies: Army[]) => void;
  selectArmy: (id: string | null) => void;
  createArmyFromSelection: () => string | null;
  renameArmy: (id: string, name: string) => void;
  deleteArmy: (id: string) => void;
  addSelectedUnitsToArmy: (id: string) => void;
  removeUnitsFromArmy: (id: string, unitIds: string[]) => void;
  eraseMembership: (id: string, member: ArmyMember) => void;

  // Track Map files
  selectedMapFilename: string | null;
  setSelectedMap: (filename: string | null) => void;

  // reset map on new project load.
  resetMapState: () => void;
}

const snapshotOf = (state: MapStore): Snapshot => ({
  units: state.placedUnits,
  paths: state.paths,
  armies: state.armies,
});

// Records the current document as an undo step and clears redo.
// Spread this into a set() call: set({ ...withHistory(get()), placedUnits: ... })
function withHistory(state: MapStore) {
  return {
    past: [...state.past, snapshotOf(state)],
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

// Whether an army change actually changed anything (so a no-op adds no undo step)
const sameArmies = (a: Army[], b: Army[]) =>
  JSON.stringify(a) === JSON.stringify(b);

// The playhead's moment for joining and leaving armies: undefined at the story's start
function armyMoment(storyStart: HistoryTime): HistoryTime | undefined {
  return placementMoment(useTimelineStore.getState().now, storyStart);
}

function nextPathName(paths: MapPath[]): string {
  const used = paths
    .map((path) => /^Path (\d+)$/.exec(path.name))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number(match[1]));
  return `Path ${used.length > 0 ? Math.max(...used) + 1 : 1}`;
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
  armies: [],
  selectedArmyId: null,
  storyStart: DEFAULT_STORY_START,
  displayMode: "months",
  pacing: [],
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

  setArmies: (armies) => set({ armies }),

  // Selecting an army selects the units that are in it, and on the map, at the playhead
  selectArmy: (id) => {
    const state = get();
    const army = state.armies.find((a) => a.id === id);
    if (!army) {
      set({ selectedArmyId: null });
      return;
    }
    const moment = useTimelineStore.getState().now ?? state.storyStart;
    const present = new Set(
      state.placedUnits
        .filter((unit) => existsAt(unit, moment))
        .map((unit) => unit.id)
    );
    set({
      selectedArmyId: army.id,
      selectedUnitIds: new Set(
        membersAt(army, moment).filter((uid) => present.has(uid))
      ),
    });
  },

  // A new army of the selected units, from the playhead's moment. One undo step.
  createArmyFromSelection: () => {
    const state = get();
    const unitIds = Array.from(state.selectedUnitIds);
    if (unitIds.length === 0) return null;
    const army: Army = {
      id: newArmyId(),
      name: nextArmyName(state.armies),
      members: [],
    };
    const armies = joinArmy(
      [...state.armies, army],
      army.id,
      unitIds,
      armyMoment(state.storyStart)
    );
    set({ ...withHistory(state), armies, selectedArmyId: army.id });
    return army.id;
  },

  renameArmy: (id, name) => {
    const state = get();
    const trimmed = name.trim();
    const army = state.armies.find((a) => a.id === id);
    if (!army || !trimmed || trimmed === army.name) return;
    set({
      ...withHistory(state),
      armies: state.armies.map((a) =>
        a.id === id ? { ...a, name: trimmed } : a
      ),
    });
  },

  // Deleting an army keeps its units and marches; the marches just no longer belong to it
  deleteArmy: (id) => {
    const state = get();
    if (!state.armies.some((a) => a.id === id)) return;
    set({
      ...withHistory(state),
      armies: state.armies.filter((a) => a.id !== id),
      paths: state.paths.map((p) => {
        if (p.armyId !== id) return p;
        const { armyId: _owner, ...rest } = p;
        return rest;
      }),
      selectedArmyId: state.selectedArmyId === id ? null : state.selectedArmyId,
    });
  },

  // The selected units join the army at the playhead's moment (leaving any other army then)
  addSelectedUnitsToArmy: (id) => {
    const state = get();
    const unitIds = Array.from(state.selectedUnitIds);
    if (unitIds.length === 0 || !state.armies.some((a) => a.id === id)) return;
    const armies = joinArmy(
      state.armies,
      id,
      unitIds,
      armyMoment(state.storyStart)
    );
    if (sameArmies(armies, state.armies)) return;
    set({ ...withHistory(state), armies });
  },

  // Units leave the army at the playhead's moment
  removeUnitsFromArmy: (id, unitIds) => {
    const state = get();
    const armies = leaveArmy(
      state.armies,
      id,
      unitIds,
      armyMoment(state.storyStart)
    );
    if (sameArmies(armies, state.armies)) return;
    set({ ...withHistory(state), armies });
  },

  // Erases one stint of a unit in an army, as if it never joined for it. Any of the army's
  // marches it was on go on without it. One undo step.
  eraseMembership: (id, member) => {
    const state = get();
    const same = (m: ArmyMember) =>
      m.unitId === member.unitId &&
      m.joins === member.joins &&
      m.leaves === member.leaves;
    const army = state.armies.find((a) => a.id === id);
    if (!army || !army.members.some(same)) return;
    set({
      ...withHistory(state),
      armies: state.armies.map((a) =>
        a.id === id ? { ...a, members: a.members.filter((m) => !same(m)) } : a
      ),
    });
  },

  setStoryStart: (storyStart) => set({ storyStart }),

  setDisplayMode: (displayMode) => set({ displayMode }),

  setPacing: (pacing) => set({ pacing }),

  setSelectedMap: (filename) => set({ selectedMapFilename: filename }),

  resetMapState: () =>
    set({
      past: [],
      future: [],
      clipboard: [],
      placedUnits: [],
      paths: [],
      armies: [],
      selectedArmyId: null,
      storyStart: DEFAULT_STORY_START,
      displayMode: "months",
      pacing: [],
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

// Keeps the marches consistent with the rest of the document, whatever changed: units joining
// or leaving armies, reshaping or re-dating a march, moving units, undoing, loading a project.
// - Every army march is made up of whoever is in its army when it sets off.
// - Every chained march's start point is where its units arrive.
// Both are derived from the document, so they add no undo steps of their own.
useMapStore.subscribe((state, previous) => {
  if (
    state.paths === previous.paths &&
    state.placedUnits === previous.placedUnits &&
    state.armies === previous.armies
  ) {
    return;
  }
  const withMembers = syncArmyMarches(
    state.paths,
    state.armies,
    state.placedUnits
  );
  const synced = syncChainedStarts(withMembers, state.placedUnits);
  if (synced !== state.paths) useMapStore.setState({ paths: synced });
});

// Development only: lets you poke at the store from the browser console,
// e.g. mapStore.getState().paths
if (process.env.NODE_ENV === "development") {
  (window as unknown as { mapStore?: typeof useMapStore }).mapStore =
    useMapStore;
}
