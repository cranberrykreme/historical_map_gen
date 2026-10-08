import { useMapStore } from "./useMapStore";
import { useTimelineStore } from "./useTimelineStore";
import { DEFAULT_STORY_START } from "../utils/convertProject";
import { getTimeline } from "../utils/timeline";
import { Unit } from "../types";

const S = DEFAULT_STORY_START;

const unit = (
  id: string,
  x: number,
  y: number,
  extra: Partial<Unit> = {}
): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 90, // facing east, so marches east need no turn
  scale: 1,
  ...extra,
});

const store = () => useMapStore.getState();
const pathOf = (id: string) => store().paths.find((p) => p.id === id)!;
const onMarch = (id: string) =>
  pathOf(id)
    .assignments.map((a) => a.unitId)
    .sort();

// Army "a" and "b" marching east twice, days 0-10 then 10-20; "c" stands apart, in no army
function armyWithTwoMarches() {
  store().setPlacedUnits([
    unit("a", 0, -20),
    unit("b", 0, 20),
    unit("c", 0, 200),
  ]);
  store().boxSelect(["a", "b"]);
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
  return { first, second, armyId };
}

beforeEach(() => {
  store().resetMapState();
  useTimelineStore.getState().reset();
});

test("both marches belong to the army made when the units were first attached", () => {
  const { first, second, armyId } = armyWithTwoMarches();
  expect(pathOf(second).armyId).toBe(armyId);
  expect(onMarch(first)).toEqual(["a", "b"]);
  expect(onMarch(second)).toEqual(["a", "b"]);
});

test("a unit that joins mid-story marches with the army's later marches, not the current one", () => {
  const { first, second, armyId } = armyWithTwoMarches();

  useTimelineStore.getState().setNow(S + 5);
  store().boxSelect(["c"]);
  store().addSelectedUnitsToArmy(armyId);

  expect(onMarch(first)).toEqual(["a", "b"]);
  expect(onMarch(second)).toEqual(["a", "b", "c"]);

  // The march still starts where the first one ends
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 6);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 6);

  // It stands still until the army sets off on day 10, then marches with it, keeping its
  // place relative to the army's route
  const timeline = getTimeline(store().paths, store().placedUnits);
  const beforeSetOff = timeline.stateAt(S + 9).get("c") ?? { x: 0, y: 200 };
  expect(beforeSetOff.x).toBeCloseTo(0, 3);
  expect(beforeSetOff.y).toBeCloseTo(200, 3);
  const atEnd = timeline.stateAt(S + 20).get("c")!;
  expect(atEnd.x).toBeCloseTo(1000, 3);
  expect(atEnd.y).toBeCloseTo(200, 3);

  // Undo takes it off the march again
  store().undo();
  expect(onMarch(second)).toEqual(["a", "b"]);
});

test("a unit that leaves mid-story stops taking part in the army's later marches", () => {
  const { first, second, armyId } = armyWithTwoMarches();

  useTimelineStore.getState().setNow(S + 5);
  store().removeUnitsFromArmy(armyId, ["b"]);

  expect(onMarch(first)).toEqual(["a", "b"]);
  expect(onMarch(second)).toEqual(["a"]);

  // It stays where the first march left it, and the army's next march still starts where
  // the first one ends
  const timeline = getTimeline(store().paths, store().placedUnits);
  expect(timeline.stateAt(S + 20).get("b")!.x).toBeCloseTo(1000, 3);
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 6);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 6);
  expect(timeline.stateAt(S + 20).get("a")!.y).toBeCloseTo(-20, 3);
});

test("attaching units to an army's march makes them join the army as it sets off", () => {
  const { second, armyId } = armyWithTwoMarches();

  store().boxSelect(["c"]);
  store().attachSelectedUnitsToPath(second);

  const army = store().armies.find((a) => a.id === armyId)!;
  expect(army.members.find((m) => m.unitId === "c")).toEqual({
    unitId: "c",
    joins: S + 10,
  });
  expect(onMarch(second)).toEqual(["a", "b", "c"]);
});

test("a unit that hasn't appeared yet, or has left the map, isn't on the march", () => {
  const { second, armyId } = armyWithTwoMarches();

  store().setPlacedUnits(
    store().placedUnits.map((u) => (u.id === "a" ? { ...u, leaves: S + 8 } : u))
  );
  expect(onMarch(second)).toEqual(["b"]);

  // Bringing it back puts it on the march again
  store().bringBackUnits(["a"]);
  expect(onMarch(second)).toEqual(["a", "b"]);
  expect(store().armies.find((a) => a.id === armyId)!.members).toHaveLength(2);
});

test("detaching a unit from an army's march makes it leave the army as the march sets off", () => {
  const { first, second, armyId } = armyWithTwoMarches();

  store().detachUnitFromPath(second, "b");

  expect(onMarch(first)).toEqual(["a", "b"]);
  expect(onMarch(second)).toEqual(["a"]);
  const army = store().armies.find((a) => a.id === armyId)!;
  expect(army.members.find((m) => m.unitId === "b")).toEqual({
    unitId: "b",
    leaves: S + 10,
  });
  // The march's start stays where the first march ends
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 6);

  // Undo puts it back in the army, and on the march
  store().undo();
  expect(onMarch(second)).toEqual(["a", "b"]);
});

test("detaching from a march at the story's start takes the unit out of the army altogether", () => {
  const { first, second, armyId } = armyWithTwoMarches();

  store().detachUnitFromPath(first, "a");

  expect(onMarch(first)).toEqual(["b"]);
  expect(onMarch(second)).toEqual(["b"]);
  const army = store().armies.find((a) => a.id === armyId)!;
  expect(army.members.map((m) => m.unitId)).toEqual(["b"]);
});

test("a unit joining from elsewhere doesn't turn the army's formation", () => {
  const { second, armyId } = armyWithTwoMarches();
  store().setFormationMode(second, "wheel");

  // "c" faces north while the army faces east
  store().setPlacedUnits(
    store().placedUnits.map((u) => (u.id === "c" ? { ...u, rotation: 0 } : u))
  );
  useTimelineStore.getState().setNow(S + 5);
  store().boxSelect(["c"]);
  store().addSelectedUnitsToArmy(armyId);

  // "a" and "b" still march straight east, side by side as before
  const timeline = getTimeline(store().paths, store().placedUnits);
  const atEnd = timeline.stateAt(S + 20);
  expect(atEnd.get("a")!.y).toBeCloseTo(-20, 3);
  expect(atEnd.get("b")!.y).toBeCloseTo(20, 3);
  expect(atEnd.get("a")!.x).toBeCloseTo(2000, 3);
});

// The same army with a third march, days 20-30, on to the south-east
function armyWithThreeMarches() {
  const marches = armyWithTwoMarches();
  store().boxSelect(["a", "b"]);
  const third = store().addPath([
    { x: 2000, y: 0 },
    { x: 3000, y: 500 },
  ]);
  store().attachSelectedUnitsToPath(third);
  store().setMarchTiming(third, { start: S + 20, end: S + 30, turn: 0 });
  return { ...marches, third };
}

const startOf = (id: string) => pathOf(id).points[0];

test("units joining or leaving never move where the army's later marches start", () => {
  const { second, third, armyId } = armyWithThreeMarches();
  expect(startOf(second)).toEqual({ x: 1000, y: 0 });
  expect(startOf(third)).toEqual({ x: 2000, y: 0 });

  // "c" joins during the first march
  useTimelineStore.getState().setNow(S + 5);
  store().boxSelect(["c"]);
  store().addSelectedUnitsToArmy(armyId);
  expect(onMarch(third)).toEqual(["a", "b", "c"]);
  expect(startOf(second)).toEqual({ x: 1000, y: 0 });
  expect(startOf(third)).toEqual({ x: 2000, y: 0 });

  // "b" leaves during the second march
  useTimelineStore.getState().setNow(S + 15);
  store().removeUnitsFromArmy(armyId, ["b"]);
  expect(onMarch(third)).toEqual(["a", "c"]);
  expect(startOf(third)).toEqual({ x: 2000, y: 0 });

  // Taking "a" off the third march doesn't move it either
  store().detachUnitFromPath(third, "a");
  expect(onMarch(third)).toEqual(["c"]);
  expect(startOf(third)).toEqual({ x: 2000, y: 0 });

  // "c" still keeps its place beside the route: the third march carries it as far as the
  // route goes, 1000 east and 500 south
  const timeline = getTimeline(store().paths, store().placedUnits);
  const setsOff = timeline.stateAt(S + 20).get("c")!;
  const atEnd = timeline.stateAt(S + 30).get("c")!;
  expect(atEnd.x - setsOff.x).toBeCloseTo(1000, 3);
  expect(atEnd.y - setsOff.y).toBeCloseTo(500, 3);
});
