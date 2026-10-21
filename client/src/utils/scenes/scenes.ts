import { Battle, BattleKind, MAP_SCENE, SceneContent } from "../../types";
import { parseTerrain } from "../terrain/terrain";
import { isTerrainStyle } from "../terrain/terrainStyles";
import { sceneExists } from "./kinds";

// The sizes a new battle can be, in map units (a unit is 48 map units wide)
export const BATTLE_SIZES: { label: string; width: number; height: number }[] =
  [
    { label: "Small", width: 1600, height: 1000 },
    { label: "Medium", width: 2400, height: 1500 },
    { label: "Large", width: 3600, height: 2250 },
  ];

export const DEFAULT_BATTLE_KIND: BattleKind = "land";

export const emptyScene = (): SceneContent => ({
  units: [],
  paths: [],
  armies: [],
});

export const newBattleId = () =>
  `battle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// "Battle 1", "Battle 2", ... skipping names already taken
export function nextBattleName(battles: Battle[]): string {
  const taken = new Set(battles.map((battle) => battle.name));
  let n = battles.length + 1;
  while (taken.has(`Battle ${n}`)) n++;
  return `Battle ${n}`;
}

// What the store holds for scenes: the scene being edited is spread out as the usual units,
// paths and armies, and every other scene waits in the stash
export interface SceneHolder {
  activeSceneId: string;
  sceneStash: Record<string, SceneContent>;
  placedUnits: SceneContent["units"];
  paths: SceneContent["paths"];
  armies: SceneContent["armies"];
}

// Every scene's content by scene id, the one being edited included
export function allScenes(state: SceneHolder): Record<string, SceneContent> {
  return {
    ...state.sceneStash,
    [state.activeSceneId]: {
      units: state.placedUnits,
      paths: state.paths,
      armies: state.armies,
    },
  };
}

// Takes one scene out of the set to edit, leaving the rest in the stash. A scene with nothing
// saved yet starts empty.
export function openScene(
  scenes: Record<string, SceneContent>,
  sceneId: string
): {
  content: SceneContent;
  stash: Record<string, SceneContent>;
} {
  const { [sceneId]: content, ...stash } = scenes;
  return { content: content ?? emptyScene(), stash };
}

// The scene to show: the one asked for if it still exists, otherwise the main map
export const existingScene = (sceneId: string, battles: Battle[]): string =>
  sceneExists(sceneId, battles) ? sceneId : MAP_SCENE;

// How to place a box (in map units) so it fits the screen with some room around it
export function fitBox(
  box: { x: number; y: number; width: number; height: number },
  screenWidth: number,
  screenHeight: number,
  margin = 0.85
): { x: number; y: number; scale: number } {
  const scale =
    Math.min(screenWidth / box.width, screenHeight / box.height) * margin;
  return {
    scale,
    x: screenWidth / 2 - (box.x + box.width / 2) * scale,
    y: screenHeight / 2 - (box.y + box.height / 2) * scale,
  };
}

// Reads the battles saved in a project file, leaving out anything that isn't one
export function parseBattleInfo(raw: any): Battle | null {
  if (!raw || typeof raw !== "object" || typeof raw.id !== "string")
    return null;
  const size = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) && value > 0
      ? value
      : fallback;
  return {
    id: raw.id,
    name: typeof raw.name === "string" && raw.name ? raw.name : "Battle",
    kind: raw.kind === "sea" ? "sea" : "land",
    width: size(raw.width, BATTLE_SIZES[0].width),
    height: size(raw.height, BATTLE_SIZES[0].height),
    terrain: parseTerrain(raw.terrain),
    ...(isTerrainStyle(raw.style) ? { style: raw.style } : {}),
  };
}
