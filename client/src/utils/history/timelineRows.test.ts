import {
  groupKeyOfUnit,
  groupRows,
  itemSpan,
  MarchRow,
  NO_ARMY,
  rowItems,
} from "./timelineRows";
import { Army, MapPath, Unit } from "../../types";

const S = 100; // the story's start

const unit = (id: string, extra: Partial<Unit> = {}): Unit => ({
  id,
  filename: `${id}.png`,
  path: "",
  assetType: "units",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  ...extra,
});

const march = (
  id: string,
  start: number,
  end: number,
  unitIds: string[]
): MarchRow => ({
  path: {
    id,
    name: id,
    points: [],
    assignments: unitIds.map((unitId) => ({ unitId, forward: 0, right: 0 })),
  } as MapPath,
  timing: { start: S + start, end: S + end, turn: 0 },
});

const army = (id: string, unitIds: string[]): Army => ({
  id,
  name: id,
  members: unitIds.map((unitId) => ({ unitId })),
});

const kinds = (u: Unit, marches: MarchRow[] = []) =>
  rowItems(u, marches, S).map((item) => item.kind);

const ids = (groups: ReturnType<typeof groupRows>) =>
  groups.map((group) => [group.key, group.rows.map((r) => r.unit.id)]);

test("a row holds everything that happens to its unit, earliest first", () => {
  const knights = unit("k", {
    appears: S + 1,
    leaves: S + 9,
    exit: { style: "fall" },
    block: {
      kind: "horse",
      colour: "red",
      width: 10,
      depth: 4,
      losses: [{ start: S + 6, end: S + 7, share: 0.3 }],
    },
  });
  const marches = [march("m2", 4, 5, ["k"]), march("m1", 2, 3, ["k", "x"])];
  expect(kinds(knights, marches)).toEqual([
    "arrives",
    "march",
    "march",
    "loss",
    "leaves",
  ]);
  const items = rowItems(knights, marches, S);
  expect(items[1]).toMatchObject({ kind: "march", path: { id: "m1" } });
  expect(items[4]).toEqual({ kind: "leaves", at: S + 9, style: "fall" });
  expect(itemSpan(items[3])).toEqual([S + 6, S + 7]);
});

test("a unit there from the start has no arrival, and one that never leaves has no leaving", () => {
  expect(kinds(unit("a"))).toEqual([]);
  expect(kinds(unit("a", { appears: S }))).toEqual([]);
  expect(kinds(unit("a", { leaves: S + 2 }))).toEqual(["leaves"]);
  expect(rowItems(unit("a", { leaves: S + 2 }), [], S)[0]).toMatchObject({
    style: null,
  });
});

test("a unit is grouped under the first army it is ever in", () => {
  const armies = [army("A", ["a"]), army("B", ["a", "b"])];
  expect(groupKeyOfUnit("a", armies)).toBe("A");
  expect(groupKeyOfUnit("b", armies)).toBe("B");
  expect(groupKeyOfUnit("c", armies)).toBe(NO_ARMY);
});

test("groups follow the armies' order, then units in no army; rows go earliest first", () => {
  const units = [
    unit("loose"),
    unit("late", { appears: S + 8 }),
    unit("early", { appears: S + 2 }),
    unit("still"),
    unit("a1"),
  ];
  const armies = [army("A", ["a1"]), army("B", ["late", "early", "still"])];
  const groups = groupRows(units, [], armies, "everything", S, new Set());
  expect(ids(groups)).toEqual([
    ["A", ["a1"]],
    ["B", ["early", "late", "still"]],
    [NO_ARMY, ["loose"]],
  ]);
  expect(groups[1]).toMatchObject({ total: 3, start: S + 2, end: S + 8 });
  expect(groups[0]).toMatchObject({ start: null, end: null });
});

test("Marches lists only the units that march, with just their marches", () => {
  const units = [unit("a", { appears: S + 1 }), unit("b"), unit("c")];
  const marches = [march("m", 2, 3, ["a"])];
  const groups = groupRows(units, marches, [], "marches", S, new Set());
  expect(ids(groups)).toEqual([[NO_ARMY, ["a"]]]);
  expect(groups[0].rows[0].items.map((item) => item.kind)).toEqual(["march"]);
  expect(groups[0].total).toBe(3);
});

test("selected units are always listed", () => {
  const units = [unit("a"), unit("b")];
  const groups = groupRows(units, [], [], "marches", S, new Set(["b"]));
  expect(ids(groups)).toEqual([[NO_ARMY, ["b"]]]);
});

test("Battle and Map have nothing to list yet", () => {
  const units = [unit("a")];
  expect(groupRows(units, [], [], "battle", S, new Set())).toEqual([]);
  expect(groupRows(units, [], [], "map", S, new Set())).toEqual([]);
});
