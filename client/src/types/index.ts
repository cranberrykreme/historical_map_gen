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
}

export interface ProjectData {
  name: string;
  units: Unit[];
  paths?: MapPath[];
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
}
