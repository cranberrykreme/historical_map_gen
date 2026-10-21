import { headingAtDistance, samplePath } from "./pathGeometry";

const bend = samplePath([
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
]);

test("the heading at a waypoint is the curve's own tangent", () => {
  // The curve passes through the middle waypoint heading the way the next waypoint lies from
  // the previous one: down and to the right, 45°. Sample 40 is that waypoint.
  expect(headingAtDistance(bend, bend.samples[40].distance)).toBeCloseTo(
    Math.PI / 4,
    6
  );
});

test("the heading does not jump across a waypoint", () => {
  const at = bend.samples[40].distance;
  const before = headingAtDistance(bend, at - 0.01);
  const after = headingAtDistance(bend, at + 0.01);
  expect(Math.abs(after - before)).toBeLessThan(0.002);
});
