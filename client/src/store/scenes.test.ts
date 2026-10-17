import { useMapStore } from "./useMapStore";
import { MAP_SCENE } from "../types";

const store = () => useMapStore.getState();
const unitNames = () => store().placedUnits.map((unit) => unit.filename);

beforeEach(() => store().resetMapState());

test("a new battle gets a name, a kind and a size, and starts empty", () => {
  const id = store().addBattle({ kind: "sea" });
  expect(store().battles).toEqual([
    { id, name: "Battle 1", kind: "sea", width: 1600, height: 1000 },
  ]);
  store().addUnitAtPosition("units/army.png", "units", 10, 10);
  store().switchScene(id);
  expect(store().activeSceneId).toBe(id);
  expect(store().placedUnits).toEqual([]);
});

test("each scene keeps its own units, paths and armies", () => {
  store().addUnitAtPosition("units/map-army.png", "units", 10, 10);
  const id = store().addBattle({ name: "Hastings" });
  store().switchScene(id);
  store().addUnitAtPosition("units/battle-army.png", "units", 20, 20);
  expect(unitNames()).toEqual(["battle-army.png"]);

  store().switchScene(MAP_SCENE);
  expect(unitNames()).toEqual(["map-army.png"]);
  expect(store().sceneStash[id].units.map((u) => u.filename)).toEqual([
    "battle-army.png",
  ]);

  const all = store().sceneContents();
  expect(all[MAP_SCENE].units).toHaveLength(1);
  expect(all[id].units).toHaveLength(1);
});

test("switching scenes clears the selection and isn't an undo step", () => {
  store().addUnitAtPosition("units/army.png", "units", 10, 10);
  store().selectUnit(store().placedUnits[0].id);
  const id = store().addBattle();
  const steps = store().past.length;
  store().switchScene(id);
  expect(store().selectedUnitIds.size).toBe(0);
  expect(store().past.length).toBe(steps);
});

test("undo works within the open scene and never mixes scenes up", () => {
  store().addUnitAtPosition("units/map-army.png", "units", 10, 10);
  const id = store().addBattle();
  store().switchScene(id);
  store().addUnitAtPosition("units/battle-army.png", "units", 20, 20);

  // Undo in the battle takes the battle unit away
  store().undo();
  expect(store().activeSceneId).toBe(id);
  expect(unitNames()).toEqual([]);

  // Undoing on into steps made on the map changes the map, not the open battle
  store().undo(); // the battle being made
  expect(store().activeSceneId).toBe(MAP_SCENE); // the battle no longer exists
  expect(unitNames()).toEqual(["map-army.png"]);
  expect(store().battles).toEqual([]);

  // Redo brings the battle back, still on the map
  store().redo();
  expect(store().battles).toHaveLength(1);
  expect(store().activeSceneId).toBe(MAP_SCENE);
  store().redo();
  store().switchScene(id);
  expect(unitNames()).toEqual(["battle-army.png"]);
});

test("undoing an edit made in another scene puts that scene back without leaving this one", () => {
  const id = store().addBattle();
  store().switchScene(id);
  store().addUnitAtPosition("units/battle-army.png", "units", 20, 20);
  store().switchScene(MAP_SCENE);
  store().undo(); // takes back the battle unit, though the map is open
  expect(store().activeSceneId).toBe(MAP_SCENE);
  expect(store().sceneStash[id].units).toEqual([]);
});

test("renaming and resizing a battle are undoable; a blank name keeps the old one", () => {
  const id = store().addBattle({ name: "Hastings" });
  store().updateBattle(id, { name: "  " });
  expect(store().battles[0].name).toBe("Hastings");
  store().updateBattle(id, { name: "Senlac Hill", width: 2400 });
  expect(store().battles[0]).toMatchObject({
    name: "Senlac Hill",
    width: 2400,
  });
  store().undo();
  expect(store().battles[0]).toMatchObject({ name: "Hastings", width: 1600 });
});

test("changing a battle's terrain style is undoable", () => {
  const id = store().addBattle();
  store().updateBattle(id, { style: "winter" });
  expect(store().battles[0].style).toBe("winter");
  store().undo();
  expect(store().battles[0].style).toBeUndefined();
});

test("deleting the open battle goes back to the map and throws its contents away", () => {
  const id = store().addBattle();
  store().switchScene(id);
  store().addUnitAtPosition("units/battle-army.png", "units", 20, 20);
  store().deleteBattle(id);
  expect(store().activeSceneId).toBe(MAP_SCENE);
  expect(store().battles).toEqual([]);
  expect(store().sceneStash[id]).toBeUndefined();
  store().undo();
  expect(store().battles).toHaveLength(1);
  store().switchScene(id);
  expect(unitNames()).toEqual(["battle-army.png"]);
});

test("an edit can be run in every scene, ending back where it started", () => {
  store().addUnitAtPosition("units/a.png", "units", 10, 10);
  const id = store().addBattle();
  store().switchScene(id);
  store().addUnitAtPosition("units/b.png", "units", 20, 20);
  const visited: string[] = [];
  store().inEveryScene(() => visited.push(store().activeSceneId));
  expect(visited).toEqual([MAP_SCENE, id]);
  expect(store().activeSceneId).toBe(id);
});

test("loading puts battles in the stash and opens the main map", () => {
  store().setBattles(
    [{ id: "b1", name: "Hastings", kind: "land", width: 1600, height: 1000 }],
    { b1: { units: [], paths: [], armies: [] } }
  );
  expect(store().activeSceneId).toBe(MAP_SCENE);
  expect(Object.keys(store().sceneStash)).toEqual(["b1"]);
});
