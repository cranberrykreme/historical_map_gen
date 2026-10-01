import {
  samplePath,
  pointAtDistance,
  headingAtDistance,
  offsetFromHeading,
  applyOffset,
  facingRotation,
  svgPathData,
} from "./pathGeometry";

describe("pathGeometry", () => {
  const straight = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ];

  test("a straight path has the right length", () => {
    expect(samplePath(straight).length).toBeCloseTo(100, 5);
  });

  test("pointAtDistance walks along the path", () => {
    const mid = pointAtDistance(samplePath(straight), 50);
    expect(mid.x).toBeCloseTo(50, 3);
    expect(mid.y).toBeCloseTo(0, 5);
  });

  test("distance is clamped to the ends of the path", () => {
    const path = samplePath(straight);
    expect(pointAtDistance(path, -10).x).toBeCloseTo(0, 5);
    expect(pointAtDistance(path, 1000).x).toBeCloseTo(100, 5);
  });

  test("the curve passes through every waypoint", () => {
    const path = samplePath([
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 0 },
    ]);
    // With the default 40 steps per segment, sample 40 is the middle waypoint
    expect(path.samples[40].x).toBeCloseTo(50, 5);
    expect(path.samples[40].y).toBeCloseTo(50, 5);
    expect(path.length).toBeGreaterThan(100);
  });

  test("heading is 0 travelling right and 90 degrees travelling down", () => {
    expect(headingAtDistance(samplePath(straight), 50)).toBeCloseTo(0, 5);
    const down = samplePath([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
    ]);
    expect(headingAtDistance(down, 50)).toBeCloseTo(Math.PI / 2, 5);
  });

  test("offsetFromHeading and applyOffset are inverses", () => {
    const heading = 0.7;
    const delta = { x: 12, y: -5 };
    const back = applyOffset(
      { x: 0, y: 0 },
      offsetFromHeading(delta, heading),
      heading
    );
    expect(back.x).toBeCloseTo(12, 6);
    expect(back.y).toBeCloseTo(-5, 6);
  });

  test('"right" is the right-hand side of travel on screen (y points down)', () => {
    const p = applyOffset({ x: 0, y: 0 }, { forward: 0, right: 10 }, 0);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(10, 6);
  });

  test("facingRotation turns art to face the heading, allowing for mirroring", () => {
    expect(facingRotation(Math.PI / 2, 0, false)).toBeCloseTo(90, 6);
    expect(facingRotation(0, 0, true)).toBeCloseTo(-180, 6);
  });

  test("svgPathData starts with a move and has one curve per segment", () => {
    const d = svgPathData([
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 0 },
    ]);
    expect(d.startsWith("M 0 0")).toBe(true);
    expect((d.match(/C/g) ?? []).length).toBe(2);
  });
});
