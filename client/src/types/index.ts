export type AssetType = 'units' | 'portraits' | 'maps';

export interface Unit {
  id: string;
  filename: string;
  x: number;
  y: number;
}