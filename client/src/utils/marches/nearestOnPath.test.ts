import { nearestOnPath } from "./pathGeometry";

const straight = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
];

const arch = [
  { x: 0, y: 0 },
  { x: 50, y: 50 },
  { x: 100, y: 0 },
];

test("finds the closest point on a straight path", () => {
  const nearest = nearestOnPath(straight, { x: 30, y: 10 });
  expect(nearest).not.toBeNull();
  expect(nearest!.point.x).toBeCloseTo(30, 0);
  expect(nearest!.point.y).toBeCloseTo(0, 5);
  expect(nearest!.distance).toBeCloseTo(10, 0);
  expect(nearest!.segmentIndex).toBe(0);
});

test("reports segment 0 for a point on the first half of a curve", () => {
  // The curve passes through about (21.9, 28.1) halfway along its first segment
  const nearest = nearestOnPath(arch, { x: 22, y: 28 });
  expect(nearest!.segmentIndex).toBe(0);
  expect(nearest!.distance).toBeLessThan(1);
});

test("reports segment 1 for a point on the second half of a curve", () => {
  // ...and through about (78.1, 28.1) halfway along its second segment
  const nearest = nearestOnPath(arch, { x: 78, y: 28 });
  expect(nearest!.segmentIndex).toBe(1);
  expect(nearest!.distance).toBeLessThan(1);
});

test("returns null when there is no curve", () => {
  expect(nearestOnPath([{ x: 0, y: 0 }], { x: 5, y: 5 })).toBeNull();
});
