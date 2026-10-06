import { MapPath, PathPoint, Unit } from "../types";
import { attachUnits } from "./formation";
import { createPlayback, easeTravel, PlaybackState } from "./pathPlayback";

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

function pathFor(points: PathPoint[], units: Unit[]): MapPath {
  const attachment = attachUnits(
    { id: "p", name: "Path 1", points, assignments: [] },
    units
  )!;
  return { id: "p", name: "Path 1", ...attachment };
}

// Two units side by side, facing north, centred on (50, 100), with a route due east
const row = () => [unit("a", 30, 100), unit("b", 70, 100)];
const east = [
  { x: 0, y: 100 },
  { x: 1000, y: 100 },
];

function expectSame(
  a: Map<string, PlaybackState>,
  b: Map<string, PlaybackState>
) {
  expect(Array.from(a.keys())).toEqual(Array.from(b.keys()));
  a.forEach((state, id) => {
    const other = b.get(id)!;
    expect(state.x).toBeCloseTo(other.x, 6);
    expect(state.y).toBeCloseTo(other.y, 6);
    expect(state.rotation).toBeCloseTo(other.rotation, 6);
    expect(state.flipped).toBe(other.flipped);
  });
}

test("a playback read by phase agrees with the same moment read by overall progress", () => {
  const units = row();
  const playback = createPlayback(pathFor(east, units), units);

  expect(playback.pivotLength).toBeCloseTo(150, 6);
  expect(playback.routeLength).toBeCloseTo(950, 6);
  expect(playback.length).toBeCloseTo(1100, 6);

  // Halfway through the turn, then halfway through the travel
  expectSame(
    playback.stateAtPhase(0.5, 0),
    playback.stateAt(75 / playback.length)
  );
  expectSame(
    playback.stateAtPhase(1, 0.5),
    playback.stateAt((150 + 475) / playback.length)
  );
  expectSame(playback.stateAtPhase(1, 1), playback.stateAt(1));
});

test("nobody moves until the turn is done, then the travel eases in", () => {
  const units = row();
  const playback = createPlayback(pathFor(east, units), units);

  // Still turning: travel is ignored, so they're where they were placed, half turned
  const turning = playback.stateAtPhase(0.5, 0.7);
  expect(turning.get("a")!.x).toBeCloseTo(30, 6);
  expect(turning.get("a")!.rotation).toBeCloseTo(45, 6);

  // Turned and 5% into the travel: still setting off gently
  const settingOff = playback.stateAtPhase(1, 0.05);
  expect(settingOff.get("a")!.x).toBeCloseTo(30 + 950 * easeTravel(0.05), 6);
  expect(settingOff.get("a")!.rotation).toBeCloseTo(90, 6);

  // Units already facing the way they go have nothing to turn, so they travel at once
  const facingEast = [unit("e", 0, 50, { rotation: 90 })];
  const straight = createPlayback(
    pathFor(
      [
        { x: 0, y: 50 },
        { x: 1000, y: 50 },
      ],
      facingEast
    ),
    facingEast
  );
  expect(straight.pivotLength).toBe(0);
  expect(straight.stateAtPhase(0, 0.5).get("e")!.x).toBeCloseTo(500, 6);
});
