import {
  groupRows,
  groupKeyOf,
  MarchRow,
  NO_ARMY,
  overlapsView,
  underWay,
} from "./timelineRows";
import { Army, MapPath } from "../types";

const S = 0;

const row = (
  id: string,
  start: number,
  end: number,
  armyId?: string
): MarchRow => ({
  path: { id, name: id, points: [], assignments: [], armyId } as MapPath,
  timing: { start: S + start, end: S + end, turn: 0 },
});

const army = (id: string): Army => ({ id, name: id, members: [] });

const everything = { from: S - 100, to: S + 100 };
const ids = (groups: ReturnType<typeof groupRows>) =>
  groups.map((group) => [group.key, group.rows.map((r) => r.path.id)]);

test("a march is under way from setting off to arriving, ends included", () => {
  const { timing } = row("p", 2, 5);
  expect(underWay(timing, S + 1.9)).toBe(false);
  expect(underWay(timing, S + 2)).toBe(true);
  expect(underWay(timing, S + 5)).toBe(true);
  expect(underWay(timing, S + 5.1)).toBe(false);
});

test("a march overlaps the view if any part of it is on show", () => {
  const { timing } = row("p", 2, 5);
  expect(overlapsView(timing, { from: S + 4, to: S + 10 })).toBe(true);
  expect(overlapsView(timing, { from: S - 10, to: S + 3 })).toBe(true);
  expect(overlapsView(timing, { from: S + 3, to: S + 4 })).toBe(true);
  expect(overlapsView(timing, { from: S + 6, to: S + 10 })).toBe(false);
});

test("groups follow the armies' order, with marches in no army last, earliest first", () => {
  const rows = [
    row("loose", 0, 1),
    row("b2", 8, 9, "B"),
    row("a1", 1, 2, "A"),
    row("b1", 3, 4, "B"),
    row("lost", 5, 6, "gone"), // its army no longer exists
  ];
  const groups = groupRows(
    rows,
    [army("A"), army("B")],
    "all",
    S,
    everything,
    null
  );
  expect(ids(groups)).toEqual([
    ["A", ["a1"]],
    ["B", ["b1", "b2"]],
    [NO_ARMY, ["loose", "lost"]],
  ]);
  expect(groups[1].start).toBe(S + 3);
  expect(groups[1].end).toBe(S + 9);
});

test("armies with no marches get no group", () => {
  const groups = groupRows(
    [row("a1", 0, 1, "A")],
    [army("A"), army("B")],
    "all",
    S,
    everything,
    null
  );
  expect(ids(groups)).toEqual([["A", ["a1"]]]);
});

test("Now lists only the marches under way at the playhead", () => {
  const rows = [row("a1", 0, 4, "A"), row("a2", 4, 8, "A"), row("loose", 6, 9)];
  const groups = groupRows(rows, [army("A")], "now", S + 5, everything, null);
  expect(ids(groups)).toEqual([["A", ["a2"]]]);
  expect(groups[0].total).toBe(2);
});

test("In view lists the marches overlapping the stretch on show", () => {
  const rows = [
    row("a1", 0, 4, "A"),
    row("a2", 4, 8, "A"),
    row("loose", 20, 30),
  ];
  const groups = groupRows(
    rows,
    [army("A")],
    "view",
    S,
    { from: S + 5, to: S + 25 },
    null
  );
  expect(ids(groups)).toEqual([
    ["A", ["a2"]],
    [NO_ARMY, ["loose"]],
  ]);
});

test("the selected march is always listed", () => {
  const rows = [row("a1", 0, 4, "A"), row("loose", 20, 30)];
  const groups = groupRows(
    rows,
    [army("A")],
    "now",
    S + 1,
    everything,
    "loose"
  );
  expect(ids(groups)).toEqual([
    ["A", ["a1"]],
    [NO_ARMY, ["loose"]],
  ]);
});

test("nothing under way lists nothing", () => {
  const rows = [row("a1", 0, 4, "A")];
  expect(groupRows(rows, [army("A")], "now", S + 10, everything, null)).toEqual(
    []
  );
});

test("a march's group is its army's, or no army's", () => {
  const armies = [army("A")];
  expect(groupKeyOf(row("x", 0, 1, "A").path, armies)).toBe("A");
  expect(groupKeyOf(row("y", 0, 1, "gone").path, armies)).toBe(NO_ARMY);
  expect(groupKeyOf(row("z", 0, 1).path, armies)).toBe(NO_ARMY);
});
