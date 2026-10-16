import { useMapStore } from "./useMapStore";
import { newBlockSpec } from "../utils/blocks";
import { useTimelineStore } from "./useTimelineStore";

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

test("units die at the playhead with their animation, or the usual one for their kind", () => {
  const blockId = store().addBlockAtPosition(newBlockSpec(), 0, 0);
  store().addUnitAtPosition("units/Army_Red1.png", "units", 5, 5);
  const army = store().placedUnits[1];
  store().setUnitsExit([army.id], { style: "fall", marker: "cross" });
  // at the story's start nobody can die
  useTimelineStore.getState().setNow(null);
  store().boxSelect([blockId, army.id]);
  expect(store().killSelectedUnits()).toBe(0);
  const later = store().storyStart + 3;
  useTimelineStore.getState().setNow(later);
  store().boxSelect([blockId, army.id]);
  expect(store().killSelectedUnits()).toBe(2);
  expect(store().placedUnits[0]).toMatchObject({
    leaves: later,
    exit: { style: "shatter" },
  });
  expect(store().placedUnits[1]).toMatchObject({
    leaves: later,
    exit: { style: "fall", marker: "cross" },
  });
  // one undo step brings them both back
  store().undo();
  expect(store().placedUnits.every((u) => u.leaves === undefined)).toBe(true);
  useTimelineStore.getState().setNow(null);
});

test("changing many units' leaving animation is one undo step", () => {
  store().addUnitAtPosition("units/a.png", "units", 0, 0);
  store().addUnitAtPosition("units/b.png", "units", 0, 0);
  const ids = store().placedUnits.map((u) => u.id);
  store().setUnitsExit(ids, { style: "fade" });
  const before = store().past.length;
  store().setUnitsExit(ids, (current) =>
    current ? { ...current, marker: "patch" } : null
  );
  expect(store().past.length).toBe(before + 1);
  expect(store().placedUnits.every((u) => u.exit?.marker === "patch")).toBe(
    true
  );
  store().setUnitsExit(ids, null);
  expect(store().placedUnits.every((u) => u.exit === undefined)).toBe(true);
});
