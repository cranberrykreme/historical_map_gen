import { buildTravelSides, samplePath, travelSideAt } from "./pathGeometry";

test("an east-bound path faces right the whole way", () => {
  const sides = buildTravelSides(
    samplePath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ])
  );
  expect(sides).toEqual([{ distance: 0, right: true }]);
  expect(travelSideAt(sides, 50)).toBe(true);
});

test("a west-bound path faces left the whole way", () => {
  const sides = buildTravelSides(
    samplePath([
      { x: 100, y: 0 },
      { x: 0, y: 0 },
    ])
  );
  expect(sides).toEqual([{ distance: 0, right: false }]);
  expect(travelSideAt(sides, 50)).toBe(false);
});

test("a U-turn flips exactly once, where the heading passes the dead zone", () => {
  const path = samplePath([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 50 },
    { x: 0, y: 50 },
  ]);
  const sides = buildTravelSides(path);

  expect(sides).toHaveLength(2);
  expect(sides[0].right).toBe(true);
  expect(sides[1].right).toBe(false);
  expect(travelSideAt(sides, 0)).toBe(true);
  expect(travelSideAt(sides, sides[1].distance - 0.01)).toBe(true);
  expect(travelSideAt(sides, sides[1].distance)).toBe(false);
  expect(travelSideAt(sides, path.length)).toBe(false);
});

test("a mostly vertical, wobbling path does not flicker", () => {
  const sides = buildTravelSides(
    samplePath([
      { x: 0, y: 0 },
      { x: 2, y: 50 },
      { x: -2, y: 100 },
      { x: 2, y: 150 },
    ])
  );
  expect(sides).toHaveLength(1);
});
