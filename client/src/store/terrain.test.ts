import { useMapStore } from "./useMapStore";

const store = () => useMapStore.getState();
const terrain = () => store().battles[0].terrain ?? [];
const tri = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 5, y: 10 },
];

beforeEach(() => store().resetMapState());

test("terrain is drawn into a battle as an undo step", () => {
  const battle = store().addBattle();
  const id = store().addTerrain(battle, "hill", tri);
  expect(id).not.toBeNull();
  expect(terrain()).toEqual([{ id, kind: "hill", points: tri }]);
  store().undo();
  expect(terrain()).toEqual([]);
});

test("a shape with too few points isn't drawn", () => {
  const battle = store().addBattle();
  expect(store().addTerrain(battle, "lake", tri.slice(0, 2))).toBeNull();
  expect(store().addTerrain(battle, "stream", tri.slice(0, 2))).not.toBeNull();
  expect(terrain()).toHaveLength(1);
});

test("a feature can be reshaped and changed to another kind, but not below its fewest points", () => {
  const battle = store().addBattle();
  const id = store().addTerrain(battle, "hill", tri)!;
  store().updateTerrain(battle, id, { kind: "forest" });
  store().updateTerrain(battle, id, { points: tri.slice(0, 2) });
  expect(terrain()[0]).toMatchObject({ kind: "forest", points: tri });
  store().undo();
  expect(terrain()[0].kind).toBe("hill");
});

test("deleting a feature takes it away, and undo brings it back", () => {
  const battle = store().addBattle();
  const id = store().addTerrain(battle, "hill", tri)!;
  store().deleteTerrain(battle, id);
  expect(terrain()).toEqual([]);
  store().undo();
  expect(terrain()).toHaveLength(1);
});

test("a brush stroke's changes are one undo step", () => {
  const battle = store().addBattle();
  const id = store().addTerrain(battle, "forest", tri)!;
  store().editTerrain(battle, {
    remove: [id],
    update: [],
    add: [{ id: "new", kind: "lake", points: tri }],
  });
  expect(terrain().map((f) => f.id)).toEqual(["new"]);
  store().undo();
  expect(terrain().map((f) => f.id)).toEqual([id]);
  // a stroke that changed nothing isn't an undo step
  store().editTerrain(battle, { remove: [], update: [], add: [] });
  store().undo();
  expect(terrain()).toEqual([]);
});
