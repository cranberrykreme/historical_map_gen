import { Battle, BattleKind, MAP_SCENE } from "../../types";

// The kinds of scene a video can show, and what each one has. Today there are two: the main
// map and battles. Story scenes (9.9) and screens such as the family tree (17.5) join this
// table, so the rest of the app asks it rather than checking for battles by hand.
export type SceneKind = "map" | "battle";

export interface SceneKindInfo {
  kind: SceneKind;
  label: string; // one scene of this kind, as the editor names it
  group: string; // the heading scenes of this kind are listed under
  // Whether the scene shows the project's map picture. Other kinds draw their own ground.
  showsMapPicture: boolean;
  // Whether the scene has its own size in map units (a battle's width and height), rather
  // than taking its size from the map picture
  ownSize: boolean;
  // Whether terrain can be drawn on it (shapes, brush, eraser, styles)
  hasTerrain: boolean;
}

export const SCENE_KINDS: Record<SceneKind, SceneKindInfo> = {
  map: {
    kind: "map",
    label: "Main map",
    group: "Maps",
    showsMapPicture: true,
    ownSize: false,
    hasTerrain: false,
  },
  battle: {
    kind: "battle",
    label: "Battle",
    group: "Battles",
    showsMapPicture: false,
    ownSize: true,
    hasTerrain: true,
  },
};

// One scene, as lists and pickers show it
export interface SceneEntry {
  id: string;
  kind: SceneKind;
  name: string;
}

// Whether a scene id is the main map. A shot with no scene films the main map.
export const isMainMap = (sceneId: string | undefined): boolean =>
  (sceneId ?? MAP_SCENE) === MAP_SCENE;

// The battle with this id, or null (the main map, or a scene that's gone)
export const findBattle = (
  battles: Battle[],
  sceneId: string | undefined
): Battle | null => battles.find((b) => b.id === sceneId) ?? null;

// The battle open in the editor, or null on the main map
export const activeBattle = (state: {
  battles: Battle[];
  activeSceneId: string;
}): Battle | null => findBattle(state.battles, state.activeSceneId);

// Which kind of scene an id is, or null when no scene has it (a deleted battle)
export function sceneKind(
  sceneId: string | undefined,
  battles: Battle[]
): SceneKind | null {
  if (isMainMap(sceneId)) return "map";
  return findBattle(battles, sceneId) ? "battle" : null;
}

// Whether a scene with this id exists
export const sceneExists = (
  sceneId: string | undefined,
  battles: Battle[]
): boolean => sceneKind(sceneId, battles) !== null;

// Every scene, the main map first and then the battles in order
export const sceneList = (battles: Battle[]): SceneEntry[] => [
  { id: MAP_SCENE, kind: "map", name: SCENE_KINDS.map.label },
  ...battles.map((b) => ({ id: b.id, kind: "battle" as const, name: b.name })),
];

// The scenes grouped by kind, as the Scenes tab lists them: every kind gets its group, in the
// table's order, even when it has no scenes yet
export interface SceneGroup {
  kind: SceneKind;
  group: string;
  scenes: SceneEntry[];
}
export const sceneGroups = (battles: Battle[]): SceneGroup[] => {
  const all = sceneList(battles);
  return (Object.keys(SCENE_KINDS) as SceneKind[]).map((kind) => ({
    kind,
    group: SCENE_KINDS[kind].group,
    scenes: all.filter((scene) => scene.kind === kind),
  }));
};

// What the "New scene" menu can make. Each later kind of scene (story scenes, screens) adds
// its own entries here.
export interface NewSceneOption {
  id: string;
  kind: SceneKind;
  battleKind?: BattleKind; // for a battle: land or sea
  label: string;
  icon: string;
  hint: string;
}
export const NEW_SCENE_OPTIONS: NewSceneOption[] = [
  {
    id: "land-battle",
    kind: "battle",
    battleKind: "land",
    label: "Land battle",
    icon: "⚔",
    hint: "A close-up battlefield of open ground",
  },
  {
    id: "sea-battle",
    kind: "battle",
    battleKind: "sea",
    label: "Sea battle",
    icon: "⚓",
    hint: "Open water, for fleets",
  },
];
