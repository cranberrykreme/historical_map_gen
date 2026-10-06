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

// When a march happens in history (days since 1 January 1970, see utils/historyTime).
// The first `turn` days are spent turning on the spot, the rest travelling.
export interface MarchTiming {
  start: number;
  end: number;
  turn: number;
}

// A moment on the video paired with a moment in history. Kept from the date markers of
// older projects, ready to become the first shot.
export interface PacingKey {
  seconds: number;
  time: number;
}

// How the date reads: "October 1066", "14 October 1066", or with the time of day too
export type HistoryDisplay = "months" | "days" | "times";

// The project file version this app writes. Version 1 (no version field) timed marches in
// seconds on the video; version 2 dates them in history.
export const PROJECT_VERSION = 2;

export interface ProjectData {
  name: string;
  version?: number;
  units: Unit[];
  paths?: MapPath[];
  storyStart?: number;
  displayMode?: HistoryDisplay;
  pacing?: PacingKey[];
  selectedMapFilename?: string | null;
  viewport?: SavedViewport | null;
}

export type ToolbarTabId = "assets" | "psd" | "portrait" | "paths";

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
