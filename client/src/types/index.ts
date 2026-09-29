export type AssetType = "units" | "portraits" | "maps";

export interface Unit {
  id: string;
  filename: string;
  path: string;
  assetType: AssetType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface ProjectData {
  name: string;
  units: Unit[];
  selectedMapFilename?: string | null;
}

export type ToolbarTabId = "assets" | "psd" | "portrait";

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
