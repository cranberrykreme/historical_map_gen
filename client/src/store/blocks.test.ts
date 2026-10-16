import { useMapStore } from "./useMapStore";
import { newBlockSpec } from "../utils/blocks";

const store = () => useMapStore.getState();

beforeEach(() => store().resetMapState());

test("a block is placed and changed, each an undo step", () => {
  const id = store().addBlockAtPosition(newBlockSpec({ name: "Fyrd" }), 50, 60);
  expect(store().placedUnits).toHaveLength(1);
  expect(store().placedUnits[0]).toMatchObject({
    id,
    x: 50,
    y: 60,
    block: { name: "Fyrd" },
  });
  store().updateBlock(id, { colour: "blue", width: 300, name: "  " });
  expect(store().placedUnits[0].block).toMatchObject({
    colour: "blue",
    width: 300,
  });
  expect(store().placedUnits[0].block!.name).toBeUndefined();
  store().undo();
  expect(store().placedUnits[0].block).toMatchObject({
    colour: "red",
    name: "Fyrd",
  });
  store().undo();
  expect(store().placedUnits).toHaveLength(0);
});

test("a change that changes nothing isn't an undo step, and pictures aren't blocks", () => {
  const id = store().addBlockAtPosition(newBlockSpec(), 0, 0);
  const before = store().past.length;
  store().updateBlock(id, { colour: "red" });
  expect(store().past.length).toBe(before);
  store().addUnitAtPosition("units/Army_Red1.png", "units", 5, 5);
  const picture = store().placedUnits[1];
  store().updateBlock(picture.id, { colour: "blue" });
  expect(store().placedUnits[1].block).toBeUndefined();
});
