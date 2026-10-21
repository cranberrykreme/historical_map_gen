// Terrain styles: the picture each style is shown with in the picker

import { TerrainFeature } from "../../types";

// A little battlefield with a bit of everything: a hill half under a wood, a river under a
// road's bridge running into a lake, a field and a village, STYLE_SAMPLE_WIDTH by
// STYLE_SAMPLE_HEIGHT map units
export const STYLE_SAMPLE_WIDTH = 640;
export const STYLE_SAMPLE_HEIGHT = 248;

// Laid out at half size, then doubled
const SAMPLE_LAYOUT: TerrainFeature[] = [
  {
    id: "sample-lake",
    kind: "lake",
    points: [
      { x: 250, y: 70 },
      { x: 300, y: 64 },
      { x: 334, y: 90 },
      { x: 330, y: 134 },
      { x: 240, y: 134 },
      { x: 226, y: 100 },
    ],
  },
  {
    id: "sample-field",
    kind: "field",
    points: [
      { x: -10, y: 82 },
      { x: 60, y: 76 },
      { x: 92, y: 104 },
      { x: 70, y: 134 },
      { x: -10, y: 134 },
    ],
  },
  {
    id: "sample-hill",
    kind: "hill",
    points: [
      { x: 40, y: 8 },
      { x: 110, y: -4 },
      { x: 170, y: 20 },
      { x: 160, y: 62 },
      { x: 92, y: 74 },
      { x: 30, y: 52 },
    ],
  },
  {
    id: "sample-forest",
    kind: "forest",
    points: [
      { x: 120, y: 14 },
      { x: 176, y: 8 },
      { x: 214, y: 30 },
      { x: 196, y: 64 },
      { x: 140, y: 60 },
    ],
  },
  {
    id: "sample-town",
    kind: "town",
    points: [
      { x: 132, y: 92 },
      { x: 190, y: 86 },
      { x: 212, y: 112 },
      { x: 180, y: 134 },
      { x: 124, y: 128 },
    ],
  },
  {
    id: "sample-river",
    kind: "river",
    points: [
      { x: 238, y: -10 },
      { x: 222, y: 40 },
      { x: 262, y: 90 },
    ],
  },
  {
    id: "sample-road",
    kind: "road",
    points: [
      { x: -10, y: 70 },
      { x: 120, y: 80 },
      { x: 330, y: 50 },
    ],
  },
];

export const STYLE_SAMPLE: TerrainFeature[] = SAMPLE_LAYOUT.map((f) => ({
  ...f,
  points: f.points.map((p) => ({ x: p.x * 2, y: p.y * 2 })),
}));
