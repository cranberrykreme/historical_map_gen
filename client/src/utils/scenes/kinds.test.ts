import { Battle, MAP_SCENE } from "../../types";
import {
  activeBattle,
  findBattle,
  isMainMap,
  SCENE_KINDS,
  sceneExists,
  sceneKind,
  sceneList,
} from "./kinds";

const battle = (id: string, name = id): Battle => ({
  id,
  name,
  kind: "land",
  width: 2000,
  height: 1200,
});
const battles = [battle("b1", "Hastings"), battle("b2", "Stamford Bridge")];

test("the main map is the scene with no id or the map's id", () => {
  expect(isMainMap(undefined)).toBe(true);
  expect(isMainMap(MAP_SCENE)).toBe(true);
  expect(isMainMap("b1")).toBe(false);
});

test("each scene id has a kind, and a deleted battle has none", () => {
  expect(sceneKind(undefined, battles)).toBe("map");
  expect(sceneKind(MAP_SCENE, battles)).toBe("map");
  expect(sceneKind("b2", battles)).toBe("battle");
  expect(sceneKind("gone", battles)).toBeNull();
  expect(sceneExists("gone", battles)).toBe(false);
  expect(sceneExists("b1", battles)).toBe(true);
});

test("finds the open battle", () => {
  expect(findBattle(battles, "b2")?.name).toBe("Stamford Bridge");
  expect(findBattle(battles, MAP_SCENE)).toBeNull();
  expect(activeBattle({ battles, activeSceneId: "b1" })?.name).toBe("Hastings");
  expect(activeBattle({ battles, activeSceneId: MAP_SCENE })).toBeNull();
});

test("lists the main map first, then the battles", () => {
  expect(sceneList(battles)).toEqual([
    { id: MAP_SCENE, kind: "map", name: "Main map" },
    { id: "b1", kind: "battle", name: "Hastings" },
    { id: "b2", kind: "battle", name: "Stamford Bridge" },
  ]);
});

test("only battles have their own size and terrain", () => {
  expect(SCENE_KINDS.map.showsMapPicture).toBe(true);
  expect(SCENE_KINDS.battle.showsMapPicture).toBe(false);
  expect(SCENE_KINDS.battle.ownSize && SCENE_KINDS.battle.hasTerrain).toBe(
    true
  );
});
