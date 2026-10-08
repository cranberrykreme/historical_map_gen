import { useMapStore } from "./useMapStore";
import { useTimelineStore } from "./useTimelineStore";
import { DEFAULT_STORY_START } from "../utils/convertProject";
import { Unit } from "../types";

const S = DEFAULT_STORY_START;

const unit = (id: string, x: number, y: number): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 90,
  scale: 1,
});

const store = () => useMapStore.getState();
const pathOf = (id: string) => store().paths.find((p) => p.id === id)!;
const onMarch = (id: string) =>
  pathOf(id)
    .assignments.map((a) => a.unitId)
    .sort();
const armyOf = (id: string) => store().armies.find((a) => a.id === id)!;

// Army "a" marching east twice, days 0-10 then 10-20, and "c" joining it on day 5
function armyWithLateJoiner() {
  store().setPlacedUnits([unit("a", 0, 0), unit("c", 0, 200)]);
  store().boxSelect(["a"]);
  const first = store().addPath([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ]);
  store().attachSelectedUnitsToPath(first);
  store().setMarchTiming(first, { start: S, end: S + 10, turn: 0 });
  const second = store().addPath([
    { x: 1000, y: 0 },
    { x: 2000, y: 0 },
  ]);
  store().attachSelectedUnitsToPath(second);
  store().setMarchTiming(second, { start: S + 10, end: S + 20, turn: 0 });
  const armyId = pathOf(first).armyId!;

  useTimelineStore.getState().setNow(S + 5);
  store().boxSelect(["c"]);
  store().addSelectedUnitsToArmy(armyId);
  useTimelineStore.getState().setNow(null);
  return { first, second, armyId };
}

beforeEach(() => {
  store().resetMapState();
  useTimelineStore.getState().reset();
});

test("erasing a later joiner's membership takes it out of the army and its marches", () => {
  const { second, armyId } = armyWithLateJoiner();
  expect(onMarch(second)).toEqual(["a", "c"]);
  const joiner = armyOf(armyId).members.find((m) => m.unitId === "c")!;
  expect(joiner).toEqual({ unitId: "c", joins: S + 5 });

  // With the playhead at the story's start, before it ever joins
  const steps = store().past.length;
  store().eraseMembership(armyId, joiner);

  expect(armyOf(armyId).members.map((m) => m.unitId)).toEqual(["a"]);
  expect(onMarch(second)).toEqual(["a"]);
  expect(store().past.length).toBe(steps + 1);

  // One undo brings it back
  store().undo();
  expect(onMarch(second)).toEqual(["a", "c"]);
});

test("erasing one stint keeps the unit's other stints in the army", () => {
  const { armyId } = armyWithLateJoiner();
  useTimelineStore.getState().setNow(S + 8);
  store().removeUnitsFromArmy(armyId, ["c"]);
  useTimelineStore.getState().setNow(S + 12);
  store().boxSelect(["c"]);
  store().addSelectedUnitsToArmy(armyId);

  const stints = armyOf(armyId).members.filter((m) => m.unitId === "c");
  expect(stints).toEqual([
    { unitId: "c", joins: S + 5, leaves: S + 8 },
    { unitId: "c", joins: S + 12 },
  ]);

  store().eraseMembership(armyId, stints[0]);
  expect(armyOf(armyId).members.filter((m) => m.unitId === "c")).toEqual([
    { unitId: "c", joins: S + 12 },
  ]);
});

test("erasing a membership that isn't there changes nothing and adds no undo step", () => {
  const { armyId } = armyWithLateJoiner();
  const steps = store().past.length;
  store().eraseMembership(armyId, { unitId: "c", joins: S + 99 });
  expect(store().past.length).toBe(steps);
});
