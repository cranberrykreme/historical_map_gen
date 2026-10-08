import { Army, MapPath } from "../types";
import { toHistoryTime } from "./historyTime";
import {
  armyForAttach,
  armyOfUnitAt,
  deriveArmies,
  everMembers,
  forgetUnits,
  joinArmy,
  leaveArmy,
  membersAt,
  nextArmyName,
} from "./armies";

const S = toHistoryTime({ year: 1066, month: 9, day: 1 });

const army = (id: string, members: Army["members"], name = id): Army => ({
  id,
  name,
  members,
});

const path = (id: string, unitIds: string[]): MapPath => ({
  id,
  name: id,
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  ],
  assignments: unitIds.map((unitId) => ({ unitId, forward: 0, right: 0 })),
});

test("an army's members are the units whose membership is in force at a moment", () => {
  const a = army("a", [
    { unitId: "u1" },
    { unitId: "u2", joins: S + 3 },
    { unitId: "u3", leaves: S + 5 },
  ]);

  expect(membersAt(a, S)).toEqual(["u1", "u3"]);
  expect(membersAt(a, S + 4)).toEqual(["u1", "u2", "u3"]);
  expect(membersAt(a, S + 5)).toEqual(["u1", "u2"]);
  expect(everMembers(a)).toEqual(["u1", "u2", "u3"]);
  expect(armyOfUnitAt([a], "u2", S)).toBeUndefined();
  expect(armyOfUnitAt([a], "u2", S + 3)?.id).toBe("a");
});

test("armies are named Army 1, Army 2... after the highest number used", () => {
  expect(nextArmyName([])).toBe("Army 1");
  expect(
    nextArmyName([army("x", [], "Army 4"), army("y", [], "Normans")])
  ).toBe("Army 5");
});

test("joining at a moment leaves the unit's other army then", () => {
  const armies = [army("a", [{ unitId: "u1" }]), army("b", [])];
  const next = joinArmy(armies, "b", ["u1"], S + 2);

  expect(next[0].members).toEqual([{ unitId: "u1", leaves: S + 2 }]);
  expect(next[1].members).toEqual([{ unitId: "u1", joins: S + 2 }]);
  expect(armyOfUnitAt(next, "u1", S + 1)?.id).toBe("a");
  expect(armyOfUnitAt(next, "u1", S + 2)?.id).toBe("b");

  // Already a member: nothing changes
  expect(joinArmy(next, "b", ["u1"], S + 3)).toEqual(next);
});

test("joining at the story's start moves the unit outright", () => {
  const armies = [army("a", [{ unitId: "u1" }]), army("b", [])];
  const next = joinArmy(armies, "b", ["u1"], undefined);
  expect(next[0].members).toEqual([]);
  expect(next[1].members).toEqual([{ unitId: "u1" }]);
});

test("leaving ends a membership then, or removes it if it began at that moment", () => {
  const armies = [
    army("a", [{ unitId: "u1" }, { unitId: "u2", joins: S + 4 }]),
  ];

  expect(leaveArmy(armies, "a", ["u1"], S + 6)[0].members[0]).toEqual({
    unitId: "u1",
    leaves: S + 6,
  });
  expect(leaveArmy(armies, "a", ["u2"], S + 4)[0].members).toEqual([
    { unitId: "u1" },
  ]);
  expect(leaveArmy(armies, "a", ["u1"], undefined)[0].members).toEqual([
    { unitId: "u2", joins: S + 4 },
  ]);
  // Not a member at that moment: nothing to end
  expect(leaveArmy(armies, "a", ["u2"], S + 1)).toEqual(armies);
});

test("units deleted from the project are forgotten by every army", () => {
  const armies = [
    army("a", [{ unitId: "u1" }, { unitId: "u2" }]),
    army("b", [{ unitId: "u3" }]),
  ];
  const next = forgetUnits(armies, new Set(["u2"]));
  expect(next[0].members).toEqual([{ unitId: "u1" }]);
  expect(next[1]).toBe(armies[1]);
});

test("attaching units picks their army, makes a new one, or none for a mix", () => {
  const armies = [army("a", [{ unitId: "u1" }, { unitId: "u2" }])];

  expect(armyForAttach(armies, ["u1", "u2"], S + 1)).toEqual({
    armies,
    armyId: "a",
  });

  const fresh = armyForAttach(armies, ["u3", "u4"], S + 2);
  expect(fresh.armies).toHaveLength(2);
  expect(fresh.armies[1].name).toBe("Army 1");
  expect(fresh.armies[1].members).toEqual([
    { unitId: "u3", joins: S + 2 },
    { unitId: "u4", joins: S + 2 },
  ]);
  expect(fresh.armyId).toBe(fresh.armies[1].id);

  expect(armyForAttach(armies, ["u1", "u3"], S + 1)).toEqual({
    armies,
    armyId: undefined,
  });
});

test("an older project's units that share marches become one army each", () => {
  const paths = [
    path("p1", ["a", "b"]),
    path("p2", ["b", "c"]),
    path("p3", ["d"]),
    path("empty", []),
  ];
  const derived = deriveArmies(paths, S);

  expect(derived.armies.map((a) => a.name)).toEqual(["Army 1", "Army 2"]);
  expect(derived.armies[0].members.map((m) => m.unitId)).toEqual([
    "a",
    "b",
    "c",
  ]);
  expect(derived.armies[1].members.map((m) => m.unitId)).toEqual(["d"]);
  expect(derived.paths.map((p) => p.armyId)).toEqual([
    derived.armies[0].id,
    derived.armies[0].id,
    derived.armies[1].id,
    undefined,
  ]);
});
