import { Unit } from "../types";
import { facingRotation } from "./pathGeometry";
import {
  effectiveForward,
  forwardFromPointer,
  normalizeDegrees,
  snapDegrees,
  unitFacing,
} from "./unitFacing";

const unit = (extra: Partial<Unit> = {}): Unit => ({
  id: "a",
  filename: "a.png",
  path: "a.png",
  assetType: "units",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  ...extra,
});

test("normalizeDegrees wraps into (-180, 180]", () => {
  expect(normalizeDegrees(270)).toBeCloseTo(-90, 6);
  expect(normalizeDegrees(-270)).toBeCloseTo(90, 6);
  expect(normalizeDegrees(180)).toBeCloseTo(180, 6);
  expect(normalizeDegrees(-180)).toBeCloseTo(180, 6);
  expect(normalizeDegrees(360)).toBeCloseTo(0, 6);
  expect(normalizeDegrees(725)).toBeCloseTo(5, 6);
});

test("snapDegrees snaps to 45° steps only when close to one", () => {
  expect(snapDegrees(3)).toBeCloseTo(0, 6);
  expect(snapDegrees(43)).toBeCloseTo(45, 6);
  expect(snapDegrees(92)).toBeCloseTo(90, 6);
  expect(snapDegrees(178)).toBeCloseTo(180, 6);
  expect(snapDegrees(-178)).toBeCloseTo(180, 6);
  expect(snapDegrees(52)).toBeCloseTo(52, 6);
});

test("forwardFromPointer allows for rotation and mirroring", () => {
  expect(forwardFromPointer(10, 0, 0, false)).toBeCloseTo(0, 6);
  expect(forwardFromPointer(0, 10, 0, false)).toBeCloseTo(90, 6);
  // Mirrored art whose front now points right was facing left before it was flipped
  expect(forwardFromPointer(10, 0, 0, true)).toBeCloseTo(180, 6);
  // A unit turned 90° that is dragged to point down still has its art's front pointing right
  expect(forwardFromPointer(0, 10, 90, false)).toBeCloseTo(0, 6);
  expect(forwardFromPointer(10, 0, 90, false)).toBeCloseTo(-90, 6);
});

test("unitFacing defaults: art faces up, units turn to face travel, portraits stay upright", () => {
  expect(unitFacing(unit())).toEqual({
    forwardAngle: -90,
    travelMode: "rotate",
  });
  expect(unitFacing(unit({ assetType: "portraits" }))).toEqual({
    forwardAngle: -90,
    travelMode: "upright",
  });
  expect(unitFacing(unit({ forwardAngle: 90, travelMode: "fixed" }))).toEqual({
    forwardAngle: 90,
    travelMode: "fixed",
  });
  expect(
    unitFacing(unit({ assetType: "portraits", travelMode: "rotate" }))
      .travelMode
  ).toBe("rotate");
});

test("the arrow's direction and the facing rotation agree, mirrored or not", () => {
  const heading = 1; // radians
  const headingDeg = (heading * 180) / Math.PI;
  for (const flipped of [false, true]) {
    for (const forward of [0, 30, 90, -135, 180]) {
      const rotation = facingRotation(heading, forward, flipped);
      const facingNow = rotation + effectiveForward(forward, flipped);
      expect(normalizeDegrees(facingNow - headingDeg)).toBeCloseTo(0, 6);
    }
  }
});
