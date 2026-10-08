import { useMapStore } from "./useMapStore";
import { useTimelineStore } from "./useTimelineStore";
import { DEFAULT_STORY_START } from "../utils/convertProject";
import { Unit } from "../types";

const S = DEFAULT_STORY_START;

const unit = (id: string, extra: Partial<Unit> = {}): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  ...extra,
});

const store = () => useMapStore.getState();
const armyOf = (id: string) => store().armies.find((a) => a.id === id)!;

beforeEach(() => {
  store().resetMapState();
  useTimelineStore.getState().reset();
  store().setPlacedUnits([
    unit("a"),
    unit("b"),
    unit("c"),
    unit("late", { appears: S + 5 }),
  ]);
});

test("a new army from the selection is named automatically and is one undo step", () => {
  store().boxSelect(["a", "b"]);
  const id = store().createArmyFromSelection()!;

  expect(armyOf(id).name).toBe("Army 1");
  expect(armyOf(id).members).toEqual([{ unitId: "a" }, { unitId: "b" }]);
  expect(store().selectedArmyId).toBe(id);

  store().undo();
  expect(store().armies).toEqual([]);
  store().redo();
  expect(armyOf(id).members).toHaveLength(2);
});

test("units join and leave an army at the playhead's moment", () => {
  store().boxSelect(["a"]);
  const id = store().createArmyFromSelection()!;

  useTimelineStore.getState().setNow(S + 3);
  store().boxSelect(["c"]);
  store().addSelectedUnitsToArmy(id);
  expect(armyOf(id).members).toEqual([
    { unitId: "a" },
    { unitId: "c", joins: S + 3 },
  ]);

  useTimelineStore.getState().setNow(S + 8);
  store().removeUnitsFromArmy(id, ["a"]);
  expect(armyOf(id).members[0]).toEqual({ unitId: "a", leaves: S + 8 });

  // Nothing to change: no undo step
  const steps = store().past.length;
  store().removeUnitsFromArmy(id, ["b"]);
  expect(store().past.length).toBe(steps);
});

test("selecting an army selects its members who are on the map at the playhead", () => {
  store().boxSelect(["a", "late"]);
  const id = store().createArmyFromSelection()!;
  store().selectUnit(null);

  store().selectArmy(id);
  expect(Array.from(store().selectedUnitIds)).toEqual(["a"]); // "late" hasn't appeared yet

  useTimelineStore.getState().setNow(S + 6);
  store().selectArmy(id);
  expect(Array.from(store().selectedUnitIds).sort()).toEqual(["a", "late"]);
});

test("renaming and deleting an army; its marches stay but no longer belong to it", () => {
  store().boxSelect(["a"]);
  const id = store().createArmyFromSelection()!;
  const pathId = store().addPath([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  ]);
  store().setPaths(
    store().paths.map((p) => (p.id === pathId ? { ...p, armyId: id } : p))
  );

  store().renameArmy(id, "  Normans ");
  expect(armyOf(id).name).toBe("Normans");

  store().deleteArmy(id);
  expect(store().armies).toEqual([]);
  expect(store().paths[0].armyId).toBeUndefined();
  expect(store().placedUnits).toHaveLength(4);

  store().undo();
  expect(armyOf(id).name).toBe("Normans");
  expect(store().paths[0].armyId).toBe(id);
});

test("deleting a unit outright removes it from its army", () => {
  store().boxSelect(["a", "b"]);
  const id = store().createArmyFromSelection()!;

  store().boxSelect(["a"]);
  store().removeSelectedUnits();
  expect(armyOf(id).members).toEqual([{ unitId: "b" }]);
});
