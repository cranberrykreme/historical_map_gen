import { parseProject } from "./convertProject";
import { toHistoryTime } from "./historyTime";

const path = (id: string, unitIds: string[], extra: object = {}) => ({
  id,
  name: id,
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  ],
  assignments: unitIds.map((unitId) => ({ unitId, forward: 0, right: 0 })),
  ...extra,
});

test("a project saved before armies gets one army per group of units that march together", () => {
  const project = parseProject({
    version: 2,
    units: [],
    paths: [path("p1", ["a", "b"]), path("p2", ["b"]), path("p3", ["c"])],
  });

  expect(project.armies.map((a) => a.name)).toEqual(["Army 1", "Army 2"]);
  expect(project.armies[0].members).toEqual([{ unitId: "a" }, { unitId: "b" }]);
  expect(project.paths.map((p) => p.armyId)).toEqual([
    project.armies[0].id,
    project.armies[0].id,
    project.armies[1].id,
  ]);
});

test("saved armies are read as they are, and a march's missing army is dropped", () => {
  const project = parseProject({
    version: 3,
    units: [],
    paths: [
      path("p1", ["a"], { armyId: "x" }),
      path("p2", ["b"], { armyId: "gone" }),
    ],
    armies: [
      {
        id: "x",
        name: "Normans",
        members: [{ unitId: "a", joins: 5, leaves: "soon" }, { nope: true }],
      },
      { name: "no id" },
    ],
  });

  expect(project.armies).toEqual([
    { id: "x", name: "Normans", members: [{ unitId: "a", joins: 5 }] },
  ]);
  expect(project.paths[0].armyId).toBe("x");
  expect(project.paths[1].armyId).toBeUndefined();
});

test("an empty list of armies is kept empty, not re-derived", () => {
  const project = parseProject({
    version: 3,
    units: [],
    paths: [path("p1", ["a"])],
    armies: [],
  });
  expect(project.armies).toEqual([]);
  expect(project.paths[0].armyId).toBeUndefined();
});

const S = toHistoryTime({ year: 1066, month: 9, day: 1 });
const dated = (start: number, end: number) => ({
  march: { start, end, turn: 0 },
});

test("armies saved before membership decided marches are rebuilt so every march keeps its units", () => {
  const project = parseProject({
    version: 2,
    storyStart: S,
    units: [],
    paths: [
      path("first", ["a", "b"], { armyId: "x", ...dated(S, S + 5) }),
      path("second", ["a", "c"], { armyId: "x", ...dated(S + 5, S + 9) }),
    ],
    armies: [
      {
        id: "x",
        name: "Normans",
        members: [
          { unitId: "a" },
          { unitId: "b" },
          { unitId: "c" },
          { unitId: "spare" },
        ],
      },
    ],
  });

  expect(project.armies[0].name).toBe("Normans");
  expect(project.armies[0].members).toEqual([
    { unitId: "a" }, // on both marches, from the start
    { unitId: "b", leaves: S + 5 }, // only on the first
    { unitId: "c", joins: S + 5 }, // only on the second
    { unitId: "spare" }, // on no march: kept as it was
  ]);
});

test("a project saved before armies gets dated memberships matching its marches", () => {
  const project = parseProject({
    version: 2,
    storyStart: S,
    units: [],
    paths: [
      path("first", ["a", "b"], dated(S + 1, S + 5)),
      path("second", ["a"], dated(S + 5, S + 9)),
      path("third", ["a", "b"], dated(S + 9, S + 12)),
    ],
  });

  expect(project.armies).toHaveLength(1);
  expect(project.armies[0].members).toEqual([
    { unitId: "a", joins: S + 1 },
    { unitId: "b", joins: S + 1, leaves: S + 5 },
    { unitId: "b", joins: S + 9 },
  ]);
});
