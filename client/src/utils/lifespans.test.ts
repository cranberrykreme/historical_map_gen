import { Unit } from "../types";
import { toHistoryTime } from "./historyTime";
import {
  defaultMarchStart,
  editableAt,
  homeMoment,
  placementMoment,
  removeUnitsAt,
} from "./lifespans";

const S = toHistoryTime({ year: 1066, month: 9, day: 1 });

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

test("a unit is placed at the story's start, or at the moment it appears", () => {
  expect(homeMoment({}, S)).toBe(S);
  expect(homeMoment({ appears: S + 5 }, S)).toBe(S + 5);
  // Appearing before the story starts counts as being there from the start
  expect(homeMoment({ appears: S - 5 }, S)).toBe(S);
});

test("a unit can only be edited at its own home moment", () => {
  expect(editableAt({}, null, S)).toBe(true);
  expect(editableAt({}, S + 1, S)).toBe(false);

  expect(editableAt({ appears: S + 5 }, null, S)).toBe(false);
  expect(editableAt({ appears: S + 5 }, S + 5, S)).toBe(true);
  expect(editableAt({ appears: S + 5 }, S + 5.1, S)).toBe(false);
});

test("units placed past the story's start appear then; at the start they have no date", () => {
  expect(placementMoment(null, S)).toBeUndefined();
  expect(placementMoment(S, S)).toBeUndefined();
  expect(placementMoment(S + 3, S)).toBe(S + 3);
});

test("removing at a unit's home moment deletes it; later, it leaves then", () => {
  const units = [unit("a"), unit("b", { appears: S + 5 }), unit("c")];

  const atStart = removeUnitsAt(units, new Set(["a"]), null, S);
  expect(atStart.units.map((u) => u.id)).toEqual(["b", "c"]);
  expect(Array.from(atStart.deletedIds)).toEqual(["a"]);

  const later = removeUnitsAt(units, new Set(["a", "b"]), S + 5, S);
  expect(Array.from(later.deletedIds)).toEqual(["b"]); // b appears now, so it goes outright
  expect(later.units.find((u) => u.id === "a")!.leaves).toBe(S + 5);
  expect(later.units.find((u) => u.id === "c")!.leaves).toBeUndefined();
});

test("a new march waits for its earlier marches and for its last unit to appear", () => {
  expect(defaultMarchStart(null, S, [{}])).toBe(S);
  expect(defaultMarchStart(S + 4, S, [{}])).toBe(S + 4);
  expect(defaultMarchStart(null, S, [{}, { appears: S + 9 }])).toBe(S + 9);
  expect(defaultMarchStart(S + 12, S, [{ appears: S + 9 }])).toBe(S + 12);
});
