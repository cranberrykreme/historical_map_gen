// Terrain: what can be drawn on a battleground

import { BattleKind, TerrainKind } from "../../types";

export type TerrainShape = "area" | "line";

export type TerrainGroup =
  | "Water"
  | "Ground"
  | "High ground"
  | "Woods & towns"
  | "Lines";

export interface TerrainKindInfo {
  kind: TerrainKind;
  label: string;
  shape: TerrainShape;
  group: TerrainGroup;
  hint: string;
}

// In the order they're drawn, bottom to top: water first, then open ground, high ground,
// woods and towns, and the lines (rivers, roads, walls) over everything. The panel offers
// them by group.
export const TERRAIN_KINDS: TerrainKindInfo[] = [
  {
    kind: "deep",
    label: "Deep water",
    shape: "area",
    group: "Water",
    hint: "Dark open sea, with waves",
  },
  {
    kind: "shallows",
    label: "Shallows",
    shape: "area",
    group: "Water",
    hint: "Light, shallow water near a shore",
  },
  {
    kind: "lake",
    label: "Lake",
    shape: "area",
    group: "Water",
    hint: "Still water: lakes, ponds, the sea in a land battle",
  },
  {
    kind: "reef",
    label: "Reef",
    shape: "area",
    group: "Water",
    hint: "Rocks just under the water: a hazard for ships",
  },
  {
    kind: "land",
    label: "Land",
    shape: "area",
    group: "Ground",
    hint: "Dry land with a sandy shore: islands and coasts in a sea battle",
  },
  {
    kind: "sand",
    label: "Sand",
    shape: "area",
    group: "Ground",
    hint: "Beaches, dunes and sandbanks",
  },
  {
    kind: "field",
    label: "Field",
    shape: "area",
    group: "Ground",
    hint: "Farmland, ploughed in rows",
  },
  {
    kind: "scrub",
    label: "Scrub",
    shape: "area",
    group: "Ground",
    hint: "Rough ground with bushes and gorse",
  },
  {
    kind: "marsh",
    label: "Marsh",
    shape: "area",
    group: "Ground",
    hint: "Wet, boggy ground",
  },
  {
    kind: "snow",
    label: "Snow",
    shape: "area",
    group: "Ground",
    hint: "Snow-covered ground",
  },
  {
    kind: "rocks",
    label: "Rocks",
    shape: "area",
    group: "High ground",
    hint: "Stony, broken ground",
  },
  {
    kind: "hill",
    label: "Hill",
    shape: "area",
    group: "High ground",
    hint: "High ground, shaded in rings that rise to the top",
  },
  {
    kind: "mountain",
    label: "Mountain",
    shape: "area",
    group: "High ground",
    hint: "Mountains, drawn as peaks",
  },
  {
    kind: "forest",
    label: "Forest",
    shape: "area",
    group: "Woods & towns",
    hint: "Broadleaf woodland",
  },
  {
    kind: "pines",
    label: "Pines",
    shape: "area",
    group: "Woods & towns",
    hint: "A pine or fir forest",
  },
  {
    kind: "orchard",
    label: "Orchard",
    shape: "area",
    group: "Woods & towns",
    hint: "Trees planted in neat rows",
  },
  {
    kind: "town",
    label: "Town",
    shape: "area",
    group: "Woods & towns",
    hint: "A village or town: roofs and lanes",
  },
  {
    kind: "walled",
    label: "Walled town",
    shape: "area",
    group: "Woods & towns",
    hint: "A town inside stone walls and towers, with a gate wherever a road comes in",
  },
  {
    kind: "river",
    label: "River",
    shape: "line",
    group: "Lines",
    hint: "A wide river: draw it from its source, and it widens as it flows into the sea or a lake",
  },
  {
    kind: "stream",
    label: "Stream",
    shape: "line",
    group: "Lines",
    hint: "A stream or brook: draw it from its source; it can run into a river",
  },
  {
    kind: "ditch",
    label: "Ditch",
    shape: "line",
    group: "Lines",
    hint: "A dug ditch or dyke",
  },
  {
    kind: "road",
    label: "Road",
    shape: "line",
    group: "Lines",
    hint: "A road or track: it gets a bridge or a ford where it crosses a river or stream",
  },
  {
    kind: "bridge",
    label: "Bridge",
    shape: "line",
    group: "Lines",
    hint: "A wooden bridge: draw it across a river",
  },
  {
    kind: "ridge",
    label: "Ridge",
    shape: "line",
    group: "Lines",
    hint: "A long, narrow hill: draw along its crest",
  },
  {
    kind: "cliff",
    label: "Cliff",
    shape: "line",
    group: "Lines",
    hint: "A cliff edge: the rocks hang down the drop, on the right of the way you draw it",
  },
  {
    kind: "wall",
    label: "Wall",
    shape: "line",
    group: "Lines",
    hint: "A stone wall",
  },
  {
    kind: "palisade",
    label: "Palisade",
    shape: "line",
    group: "Lines",
    hint: "A wooden stockade: a fence of stakes",
  },
];

export const TERRAIN_GROUPS: TerrainGroup[] = [
  "Water",
  "Ground",
  "High ground",
  "Woods & towns",
  "Lines",
];

export const kindInfo = (kind: TerrainKind): TerrainKindInfo =>
  TERRAIN_KINDS.find((k) => k.kind === kind) ?? TERRAIN_KINDS[0];

export const isLine = (kind: TerrainKind) => kindInfo(kind).shape === "line";

// The fewest points each shape can have
export const minPoints = (kind: TerrainKind) => (isLine(kind) ? 2 : 3);

// The ground under everything, the same colours the editor shows
export const GROUND_COLOUR: Record<BattleKind, string> = {
  land: "#8fae62",
  sea: "#4a78a0",
};

export const newTerrainId = () =>
  `terrain-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
