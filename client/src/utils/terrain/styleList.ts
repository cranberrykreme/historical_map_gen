// Terrain styles: the list of styles

import { TerrainStyle } from "../../types";

// A battle's terrain style: the same terrain, drawn in another look. Each style recolours
// every colour the terrain is drawn with (so every kind, and every way kinds meet, changes
// together), and some draw a little more on top: hachures or contour lines on high ground,
// paper grain, darker edges.

export interface TerrainStyleInfo {
  id: TerrainStyle;
  label: string;
  hint: string;
}

export const TERRAIN_STYLES: TerrainStyleInfo[] = [
  {
    id: "painted",
    label: "Painted",
    hint: "Full colour, lit from the top left",
  },
  {
    id: "autumn",
    label: "Autumn",
    hint: "Golden and russet woods, browning grass",
  },
  {
    id: "winter",
    label: "Winter",
    hint: "Frosty, pale and cold, the woods bare and dark",
  },
  {
    id: "arid",
    label: "Arid",
    hint: "Sun-baked: dry grass, olive scrub, turquoise water",
  },
  { id: "night", label: "Night", hint: "Dark and blue, as by moonlight" },
  {
    id: "parchment",
    label: "Parchment",
    hint: "An old map in brown ink on aged paper, hills drawn with hachures",
  },
  {
    id: "ink",
    label: "Ink",
    hint: "A black pen drawing on white paper, with hachures",
  },
  {
    id: "textbook",
    label: "Textbook",
    hint: "A flat school-atlas map, hills drawn with contour lines",
  },
];

export const DEFAULT_TERRAIN_STYLE: TerrainStyle = "painted";

export const isTerrainStyle = (value: unknown): value is TerrainStyle =>
  TERRAIN_STYLES.some((s) => s.id === value);

export const styleInfo = (style: TerrainStyle = DEFAULT_TERRAIN_STYLE) =>
  TERRAIN_STYLES.find((s) => s.id === style) ?? TERRAIN_STYLES[0];
