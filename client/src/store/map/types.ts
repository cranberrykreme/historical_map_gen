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
  Shot,
  TravelMode,
} from "../../types";
import { FormationMode } from "../../utils/formation";
import { HistoryTime } from "../../utils/historyTime";
import { Snapshot } from "./history";

export interface DragPosition {
  id: string;
  x: number;
  y: number;
}

export interface DragRotation {
  id: string;
  rotation: number;
}

export interface DragScale {
  id: string;
  scale: number;
}

export interface GroupDragDelta {
  dx: number;
  dy: number;
}

// Undo and redo over the whole document
export interface HistorySlice {
  past: Snapshot[];
  future: Snapshot[];

  set: (units: Unit[]) => void;
  undo: () => void;
  redo: () => void;
}

// What is selected, and the live previews while something is being dragged
export interface SelectionSlice {
  selectedUnitIds: Set<string>;
  dragPosition: DragPosition | null;
  dragRotation: DragRotation | null;
  dragScale: DragScale | null;
  groupDragDelta: GroupDragDelta | null;
  groupRotateDelta: number | null;
  groupScaleDelta: number | null;

  // Selection actions
  selectUnit: (id: string | null, addToSelection?: boolean) => void;
  boxSelect: (ids: string[]) => void;

  // Drag actions
  setDragPosition: (drag: DragPosition | null) => void;
  setDragRotation: (drag: DragRotation | null) => void;
  setDragScale: (drag: DragScale | null) => void;
  setGroupDragDelta: (delta: GroupDragDelta | null) => void;
  setGroupRotateDelta: (delta: number | null) => void;
  setGroupScaleDelta: (delta: number | null) => void;
}

// The placed units and everything that edits them directly
export interface UnitsSlice {
  placedUnits: Unit[];

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

  // Cleanup when an asset is deleted elsewhere (called via useAssetStore's onDeleted callback)
  cleanupDeletedAsset: (path: string, assetType: AssetType) => void;

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
  bringBackUnits: (unitIds: string[]) => void;
}

// Movement paths, the units attached to them, and when they march
export interface PathsSlice {
  paths: MapPath[];
  selectedPathId: string | null;

  // Path actions (setPaths is for loading and bypasses history)
  setPaths: (paths: MapPath[]) => void;
  selectPath: (id: string | null) => void;
  addPath: (points: PathPoint[]) => string;
  updatePathPoints: (id: string, points: PathPoint[]) => void;
  renamePath: (id: string, name: string) => void;
  deletePath: (id: string) => void;

  attachSelectedUnitsToPath: (pathId: string) => boolean;
  detachUnitFromPath: (pathId: string, unitId: string) => void;
  refreshPathFormation: (pathId: string) => void;
  setFormationMode: (pathId: string, mode: FormationMode) => void;
  setMarchTiming: (pathId: string, timing: MarchTiming) => void;
}

// Armies (setArmies is for loading and bypasses history). Joining and leaving happen at the
// playhead's moment, or from the start when the playhead is at the story's start.
export interface ArmiesSlice {
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
}

// The video's shots, in the order they play (setShots is for loading and bypasses history)
export interface ShotsSlice {
  shots: Shot[];
  selectedShotId: string | null;
  setShots: (shots: Shot[]) => void;
  selectShot: (id: string | null) => void;
  addShot: (spec?: Partial<Omit<Shot, "id">>) => string;
  updateShot: (id: string, patch: Partial<Omit<Shot, "id">>) => void;
  deleteShot: (id: string) => void;
  moveShotTo: (id: string, index: number) => void;
}

export interface StorySlice {
  // The story in history. The placed units stand as they are at `storyStart`. These load
  // with the project and bypass undo.
  storyStart: HistoryTime;
  displayMode: HistoryDisplay;
  pacing: PacingKey[]; // from older projects' date markers (they became their first shots)
  setStoryStart: (storyStart: HistoryTime) => void;
  setDisplayMode: (mode: HistoryDisplay) => void;
  setPacing: (pacing: PacingKey[]) => void;

  // Track Map files
  selectedMapFilename: string | null;
  setSelectedMap: (filename: string | null) => void;

  // reset map on new project load.
  resetMapState: () => void;
}

// The whole map document store, made from its slices
export type MapStore = HistorySlice &
  SelectionSlice &
  UnitsSlice &
  PathsSlice &
  ArmiesSlice &
  ShotsSlice &
  StorySlice;
