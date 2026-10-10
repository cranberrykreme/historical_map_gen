export type AssetType = "units" | "portraits" | "maps";

export type TravelMode = "rotate" | "upright" | "fixed";

export interface Unit {
  id: string;
  filename: string;
  path: string;
  assetType: AssetType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  flipped?: boolean;
  // Direction the unit's artwork faces, in degrees (0 = right, 90 = down, -90 = up),
  // before mirroring. Defaults to -90 (up) when not set.
  forwardAngle?: number;
  // How the unit behaves travelling along a path: "rotate" turns to face travel,
  // "upright" never rotates and mirrors left/right instead (ships, portraits),
  // "fixed" never turns or mirrors. Defaults: units rotate, portraits stay upright.
  travelMode?: TravelMode;
  // When the unit exists in history (days since 1 January 1970, see utils/historyTime).
  // Missing means it is there from the start of the story, and never leaves.
  appears?: number;
  leaves?: number;
}

// A unit's time in an army: from `joins` until `leaves` (days since 1 January 1970, see
// utils/historyTime). Missing `joins` means from the start; missing `leaves` means for good.
export interface ArmyMember {
  unitId: string;
  joins?: number;
  leaves?: number;
}

// A named group of units. A unit is in at most one army at any moment, and marches can
// belong to an army.
export interface Army {
  id: string;
  name: string;
  members: ArmyMember[];
}

// When a march happens in history (days since 1 January 1970, see utils/historyTime).
// The first `turn` days are spent turning on the spot, the rest travelling.
export interface MarchTiming {
  start: number;
  end: number;
  turn: number;
}

// A moment on the video paired with a moment in history. Kept from the date markers of
// older projects, which become their first shots.
export interface PacingKey {
  seconds: number;
  time: number;
}

// A stretch of the video showing a stretch of history. Shots play one after another, so the
// story can jump back and forth in time. Over its `seconds`, history runs from `from` to `to`
// (days since 1 January 1970, see utils/historyTime); a shot whose `from` and `to` are the
// same holds that moment, for a title or a pause.
export interface Shot {
  id: string;
  name: string;
  seconds: number;
  from: number;
  to: number;
  ease?: boolean; // eases in and out rather than running at a steady rate
  hideDate?: boolean; // hides the on-screen date while this shot is on screen
}

// How the date reads: "October 1066", "14 October 1066", or with the time of day too
export type HistoryDisplay = "months" | "days" | "times";

// The project file version this app writes. Version 1 (no version field) timed marches in
// seconds on the video; version 2 dates them in history; version 3 lets army membership
// decide who is on an army's march.
export const PROJECT_VERSION = 3;

export interface ProjectData {
  name: string;
  version?: number;
  units: Unit[];
  paths?: MapPath[];
  armies?: Army[];
  storyStart?: number;
  displayMode?: HistoryDisplay;
  pacing?: PacingKey[];
  shots?: Shot[];
  selectedMapFilename?: string | null;
  viewport?: SavedViewport | null;
}

export type ToolbarTabId = "assets" | "psd" | "portrait" | "paths" | "armies";

export interface AssetFile {
  path: string;
  filename: string;
  folder: string | null;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface PsdLayer {
  index: number;
  name: string;
  filename: string;
}

export interface RecolourSpec {
  interior: RgbColor;
  border: RgbColor;
  fill: RgbColor;
  stroke: RgbColor;
}

// The map point at the centre of the screen plus the zoom level,
// so a saved view restores correctly on any window size
export interface SavedViewport {
  centerX: number;
  centerY: number;
  scale: number;
}

// How ProjectView reads and applies the map's current view
export interface ViewportApi {
  get: () => SavedViewport | null;
  apply: (viewport: SavedViewport) => void;
}

export interface PathPoint {
  x: number;
  y: number;
}

// A unit's place in a path's formation, measured from the formation's centre
// along and across the direction of travel, so the formation turns with the path
export interface PathAssignment {
  unitId: string;
  forward: number;
  right: number;
}

export interface MapPath {
  id: string;
  name: string;
  points: PathPoint[];
  assignments: PathAssignment[];
  // The way the group attached to this path faces at rest, in degrees (0 = right, 90 = down,
  // -90 = up). Formation slots are measured against it, so the formation keeps its shape
  // whichever way the route leaves. Missing on older paths, which use the start heading.
  direction?: number;
  // When this path's march happens in history. Set when units are attached.
  march?: MarchTiming;
  // The army this march belongs to, if any
  armyId?: string;
}

// From version 1 project files only: how the date was shown, and the date markers that
// paired seconds on the video with dates. They are converted when the project loads.
export type DateMode = "months" | "days";

export interface DateMarker {
  id: string;
  time: number; // seconds on the video's timeline
  year: number;
  month: number; // 1 to 12
  day: number; // 1 to 31
}
