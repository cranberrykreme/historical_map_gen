import { MAP_SCENE } from "../types";
import {
  allScenes,
  emptyScene,
  existingScene,
  fitBox,
  nextBattleName,
  openScene,
  parseBattleInfo,
} from "./scenes";

const battle = (id: string, name: string) => ({
  id,
  name,
  kind: "land" as const,
  width: 100,
  height: 50,
});

test("new battles are numbered, skipping names already used", () => {
  expect(nextBattleName([])).toBe("Battle 1");
  expect(nextBattleName([battle("a", "Battle 2")])).toBe("Battle 3");
  expect(nextBattleName([battle("a", "Hastings")])).toBe("Battle 2");
});

test("the open scene and the stash make up every scene, and one can be opened from them", () => {
  const map = { ...emptyScene(), units: [{ id: "u" } as never] };
  const all = allScenes({
    activeSceneId: "b1",
    sceneStash: { [MAP_SCENE]: map },
    placedUnits: [],
    paths: [],
    armies: [],
  });
  expect(Object.keys(all).sort()).toEqual(["b1", MAP_SCENE].sort());
  const opened = openScene(all, MAP_SCENE);
  expect(opened.content).toBe(map);
  expect(Object.keys(opened.stash)).toEqual(["b1"]);
  expect(openScene(all, "new").content).toEqual(emptyScene());
});

test("a scene that no longer exists falls back to the main map", () => {
  expect(existingScene("b1", [battle("b1", "x")])).toBe("b1");
  expect(existingScene("gone", [battle("b1", "x")])).toBe(MAP_SCENE);
  expect(existingScene(MAP_SCENE, [])).toBe(MAP_SCENE);
});

test("a battle is fitted into the screen, centred, with room around it", () => {
  const place = fitBox(
    { x: 0, y: 0, width: 1000, height: 500 },
    1000,
    1000,
    0.5
  );
  expect(place.scale).toBe(0.5);
  expect(place.x).toBe(250);
  expect(place.y).toBe(375);
});

test("saved battles are read carefully", () => {
  expect(
    parseBattleInfo({ id: "b", name: "H", kind: "sea", width: 9, height: 8 })
  ).toEqual({
    id: "b",
    name: "H",
    kind: "sea",
    width: 9,
    height: 8,
    terrain: [],
  });
  expect(parseBattleInfo({ id: "b", kind: "volcano", width: -1 })).toEqual({
    id: "b",
    name: "Battle",
    kind: "land",
    width: 1600,
    height: 1000,
    terrain: [],
  });
  expect(parseBattleInfo({ name: "no id" })).toBeNull();
});
