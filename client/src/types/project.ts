// The project file, and editor settings saved with it

import type { MapPath } from "./marches";
import type { SavedBattle } from "./scenes";
import type { HistoryDisplay, PacingKey, Shot, VideoFrame } from "./shots";
import type { Army, Unit } from "./units";

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
  videoFrame?: VideoFrame; // landscape when missing
  selectedMapFilename?: string | null;
  viewport?: SavedViewport | null;
  // The battles, each with its own units, paths and armies. The units, paths and armies above
  // are the main map's.
  battles?: SavedBattle[];
}

export type ToolbarTabId =
  | "assets"
  | "psd"
  | "portrait"
  | "scene"
  | "drawing"
  | "shots"
  | "animations";

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
