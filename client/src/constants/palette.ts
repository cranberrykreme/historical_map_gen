import { RgbColor } from "../types";

export interface PaletteColour {
  id: string;
  label: string;
  fill: RgbColor;
  stroke: RgbColor;
}

const hex = (value: string): RgbColor => ({
  r: parseInt(value.slice(1, 3), 16),
  g: parseInt(value.slice(3, 5), 16),
  b: parseInt(value.slice(5, 7), 16),
});

export const PALETTE: PaletteColour[] = [
  { id: "green", label: "Green", fill: hex("#00ff00"), stroke: hex("#008e00") },
  {
    id: "yellow",
    label: "Yellow",
    fill: hex("#ffff00"),
    stroke: hex("#a4a400"),
  },
  { id: "red", label: "Red", fill: hex("#ff0000"), stroke: hex("#9c0000") },
  { id: "blue", label: "Blue", fill: hex("#0000ff"), stroke: hex("#00008e") },
  {
    id: "purple",
    label: "Purple",
    fill: hex("#8e0b8e"),
    stroke: hex("#500850"),
  },
  {
    id: "orange",
    label: "Orange",
    fill: hex("#ff8000"),
    stroke: hex("#9c4e00"),
  },
  { id: "pink", label: "Pink", fill: hex("#ff69b4"), stroke: hex("#993f6c") },
  { id: "grey", label: "Grey", fill: hex("#a0a0a0"), stroke: hex("#5a5a5a") },
  { id: "cyan", label: "Cyan", fill: hex("#00ffff"), stroke: hex("#008e8e") },
];
