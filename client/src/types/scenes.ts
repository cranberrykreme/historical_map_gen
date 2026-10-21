// Scenes: the main map and battles, and the terrain drawn on a battleground

import type { MapPath, PathPoint } from "./marches";
import type { Army, Unit } from "./units";

// A battle is a scene of its own, separate from the main map: a close-up battlefield of land
// or open sea, `width` by `height` map units, with its own units, paths and armies. The video
// can cut between the main map and its battles.
export type BattleKind = "land" | "sea";

export interface Battle {
  id: string;
  name: string;
  kind: BattleKind;
  width: number;
  height: number;
  // The battleground's features, bottom to top within each kind (see utils/terrain/terrain). Missing
  // on battles made before terrain.
  terrain?: TerrainFeature[];
  // How the terrain looks (see utils/terrain/terrainStyles). Missing means "painted".
  style?: TerrainStyle;
}

// A battle's look: the same terrain drawn in full colour, in another season or light, or as
// an old or textbook map
export type TerrainStyle =
  | "painted"
  | "autumn"
  | "winter"
  | "arid"
  | "night"
  | "parchment"
  | "ink"
  | "textbook";

// What can be drawn on a battleground. Areas are closed shapes (a smooth curve through their
// points, back to the start); lines are open ones (streams, roads).
export type TerrainKind =
  // water
  | "deep"
  | "shallows"
  | "lake"
  | "reef"
  // ground
  | "land"
  | "sand"
  | "field"
  | "scrub"
  | "marsh"
  | "snow"
  // high ground
  | "rocks"
  | "hill"
  | "mountain"
  // woods and settlements
  | "forest"
  | "pines"
  | "orchard"
  | "town"
  | "walled"
  // lines
  | "river"
  | "stream"
  | "ditch"
  | "road"
  | "bridge"
  | "ridge"
  | "cliff"
  | "wall"
  | "palisade";

export interface TerrainFeature {
  id: string;
  kind: TerrainKind;
  points: PathPoint[]; // map units, inside the battle's area
  name?: string; // shown in the terrain list; "Hill 1" and so on when not set
  // An area's holes, each a smooth closed curve through its points like the area's edge: a
  // clearing in a forest, an island in a lake. Made by the eraser; missing when there are none.
  holes?: PathPoint[][];
}

// Everything placed in one scene (the main map, or a battle)
export interface SceneContent {
  units: Unit[];
  paths: MapPath[];
  armies: Army[];
}

// The id of the main map among the scenes; every other scene is a battle, by its id
export const MAP_SCENE = "map";

// A battle as saved in the project file: the battle and what's in it
export interface SavedBattle extends Battle, SceneContent {}
