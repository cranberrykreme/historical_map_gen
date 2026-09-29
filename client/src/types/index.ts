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

export type ToolbarTabId = "assets" | "psd";

export interface AssetFile {
  path: string;
  filename: string;
  folder: string | null;
}
