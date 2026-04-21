export type AssetType = 'units' | 'portraits' | 'maps';

export interface Unit {
  id: string;
  filename: string;
  assetType: AssetType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}