import { Army, Unit } from "../types";
import { armyTracker } from "./follow";
import { getTimeline } from "./timeline";

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
  rotation: 0,
  scale: 1,
  ...extra,
});

const START = 1000;

test("an army is where its members are, on average, at each moment", () => {
  const units = [
    unit("a", 0, 0),
    unit("b", 100, 0),
    unit("c", 300, 300, { appears: START + 10 }),
    unit("d", 900, 900),
  ];
  const armies: Army[] = [
    {
      id: "army",
      name: "Normans",
      members: [
        { unitId: "a" },
        { unitId: "b" },
        { unitId: "c" },
        { unitId: "d", joins: START + 20 },
      ],
    },
  ];
  const track = armyTracker(getTimeline([], units), units, armies, START);
  // Only a and b at first
  expect(track("army", START + 5)).toEqual({ x: 50, y: 0 });
  // c arrives on the map, then d joins the army
  expect(track("army", START + 15)).toEqual({
    x: 400 / 3,
    y: 100,
  });
  expect(track("army", START + 25)).toEqual({ x: 325, y: 300 });
  expect(track("nobody", START + 5)).toBeNull();
});

test("an army with nobody on the map is nowhere", () => {
  const units = [unit("a", 0, 0, { leaves: START + 5 })];
  const armies: Army[] = [
    { id: "army", name: "A", members: [{ unitId: "a" }] },
  ];
  const track = armyTracker(getTimeline([], units), units, armies, START);
  expect(track("army", START + 1)).toEqual({ x: 0, y: 0 });
  expect(track("army", START + 10)).toBeNull();
});
