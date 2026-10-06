import { useMapStore } from "./useMapStore";
import { usePathToolStore } from "./usePathToolStore";
import { chainedPathIds, getTimeline } from "../utils/timeline";
import { Unit } from "../types";

const unit = (id: string, x: number, y: number): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x,
  y,
  rotation: 0,
  scale: 1,
});

const pathOf = (id: string) =>
  useMapStore.getState().paths.find((p) => p.id === id)!;

const currentTimeline = () => {
  const { paths, placedUnits } = useMapStore.getState();
  return getTimeline(paths, placedUnits);
};

// Every chained movement starts at the centre of the units as they stand when it begins
function expectChainedStartsAtArrival() {
  const { paths } = useMapStore.getState();
  const timeline = currentTimeline();
  const chained = chainedPathIds(paths);
  expect(chained.size).toBeGreaterThan(0);

  chained.forEach((id) => {
    const standing = timeline.standing.get(id)!;
    const cx = standing.reduce((sum, u) => sum + u.x, 0) / standing.length;
    const cy = standing.reduce((sum, u) => sum + u.y, 0) / standing.length;
    expect(pathOf(id).points[0].x).toBeCloseTo(cx, 4);
    expect(pathOf(id).points[0].y).toBeCloseTo(cy, 4);
  });
}

// One army placed at the origin, marching east and then on towards the south
function twoMarches() {
  useMapStore.getState().setPlacedUnits([unit("a", 0, 0)]);
  useMapStore.getState().boxSelect(["a"]);
  const first = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(first);
  const second = useMapStore.getState().addPath([
    { x: 1000, y: 0 },
    { x: 1000, y: 1000 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(second);
  return { first, second };
}

beforeEach(() => {
  useMapStore.getState().resetMapState();
  usePathToolStore.setState({
    drawingPoints: null,
    draftPath: null,
    selectedWaypoint: null,
    preview: null,
  });
});

test("a second march is scheduled when the first ends, and starts where the first ends", () => {
  const { first, second } = twoMarches();

  expect(pathOf(first).start).toBeUndefined(); // the first keeps its default timing
  expect(pathOf(second).start).toBeCloseTo(
    currentTimeline().timings.get(first)!.end,
    6
  );
  expect(pathOf(second).end!).toBeGreaterThan(pathOf(second).start!);
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 3);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 3);
});

test("the unit marches on from the end of the first march", () => {
  const { second } = twoMarches();
  const timeline = currentTimeline();
  const timing = timeline.timings.get(second)!;

  const atHandover = timeline.stateAt(timing.start).get("a")!;
  expect(atHandover.x).toBeCloseTo(1000, 3);
  expect(atHandover.y).toBeCloseTo(0, 3);

  const end = timeline.stateAt(timing.end).get("a")!;
  expect(end.x).toBeCloseTo(1000, 3);
  expect(end.y).toBeCloseTo(1000, 3);
});

test("moving the placed units shifts the first march's start but not a chained one", () => {
  const { first, second } = twoMarches();

  useMapStore.getState().commitUnitMove("a", 50, 20);
  expect(pathOf(first).points[0].x).toBeCloseTo(50, 6);
  expect(pathOf(first).points[0].y).toBeCloseTo(20, 6);
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 6);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 6);
});

test("attaching to a path that already has a timing keeps it", () => {
  useMapStore.getState().setPlacedUnits([unit("a", 0, 0)]);
  useMapStore.getState().boxSelect(["a"]);
  const first = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(first);
  const second = useMapStore.getState().addPath([
    { x: 1000, y: 0 },
    { x: 1000, y: 1000 },
  ]);
  useMapStore.getState().setPathTiming(second, 30, 40);
  useMapStore.getState().attachSelectedUnitsToPath(second);

  expect(pathOf(second).start).toBe(30);
  expect(pathOf(second).end).toBe(40);
  // ...but it still picks the unit up where the first march ended
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 3);
});

test("re-recording a chained movement keeps its start where the units arrive", () => {
  const { second } = twoMarches();

  useMapStore.getState().refreshPathFormation(second);
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 3);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 3);
});

test("reshaping the first march moves the chained march's start to the new arrival point", () => {
  useMapStore.getState().setPlacedUnits([unit("a", 0, 0)]);
  useMapStore.getState().boxSelect(["a"]);
  const first = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(first);
  useMapStore.getState().setPathTiming(first, 0, 10);
  const second = useMapStore.getState().addPath([
    { x: 1000, y: 0 },
    { x: 1000, y: 1000 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(second);

  useMapStore
    .getState()
    .updatePathPoints(first, [pathOf(first).points[0], { x: 1500, y: 0 }]);

  expect(pathOf(second).points[0].x).toBeCloseTo(1500, 3);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 3);
  expectChainedStartsAtArrival();

  // Undo puts both marches back exactly as they were
  useMapStore.getState().undo();
  expect(pathOf(first).points[1].x).toBeCloseTo(1000, 6);
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 3);
});

test("re-timing the movements re-chains them", () => {
  const { first, second } = twoMarches();

  // Play the second march first: now the first one is the one that follows on
  useMapStore.getState().setPathTiming(first, 20, 32);
  useMapStore.getState().setPathTiming(second, 0, 10);

  expect(Array.from(chainedPathIds(useMapStore.getState().paths))).toEqual([
    first,
  ]);
  expectChainedStartsAtArrival();
});

test("a project saved before starts followed their units is fixed when it loads", () => {
  const { second } = twoMarches();

  // As an older project would have it: the second march still drawn from the origin
  useMapStore
    .getState()
    .setPaths(
      useMapStore
        .getState()
        .paths.map((p) =>
          p.id === second
            ? { ...p, points: [{ x: 0, y: 0 }, ...p.points.slice(1)] }
            : p
        )
    );

  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 3);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 3);
});

test("reshaping the first march re-chains every march after it", () => {
  useMapStore.getState().setPlacedUnits([unit("a", 0, -20), unit("b", 0, 20)]);
  useMapStore.getState().boxSelect(["a", "b"]);

  const first = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(first);
  useMapStore.getState().setPathTiming(first, 0, 10);

  const second = useMapStore.getState().addPath([
    { x: 1000, y: 0 },
    { x: 1000, y: 1000 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(second);
  useMapStore.getState().setPathTiming(second, 10, 20);

  const third = useMapStore.getState().addPath([
    { x: 1000, y: 1000 },
    { x: 0, y: 1000 },
  ]);
  useMapStore.getState().attachSelectedUnitsToPath(third);
  expectChainedStartsAtArrival();

  useMapStore
    .getState()
    .updatePathPoints(first, [pathOf(first).points[0], { x: 1500, y: 300 }]);

  expect(pathOf(second).points[0].x).toBeCloseTo(1500, 2);
  expect(pathOf(second).points[0].y).toBeCloseTo(300, 2);
  expectChainedStartsAtArrival();
});

test("a chained movement's first waypoint can't be deleted", () => {
  const { second } = twoMarches();
  useMapStore
    .getState()
    .updatePathPoints(second, [
      pathOf(second).points[0],
      { x: 1000, y: 500 },
      pathOf(second).points[1],
    ]);

  usePathToolStore.getState().selectWaypoint(second, 0);
  expect(usePathToolStore.getState().deleteSelectedWaypoint()).toBe(false);

  usePathToolStore.getState().selectWaypoint(second, 1);
  expect(usePathToolStore.getState().deleteSelectedWaypoint()).toBe(true);
  expect(pathOf(second).points).toHaveLength(2);
});

test("dragging the start of the first march moves its army with it, so the next march stays put", () => {
  const { first, second } = twoMarches();
  const stepsBefore = useMapStore.getState().past.length;

  useMapStore
    .getState()
    .updatePathPoints(first, [{ x: 40, y: 30 }, pathOf(first).points[1]]);

  const army = useMapStore.getState().placedUnits.find((u) => u.id === "a")!;
  expect(army.x).toBeCloseTo(40, 6);
  expect(army.y).toBeCloseTo(30, 6);
  expect(pathOf(second).points[0].x).toBeCloseTo(1000, 3);
  expect(pathOf(second).points[0].y).toBeCloseTo(0, 3);
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);

  useMapStore.getState().undo();
  const restored = useMapStore
    .getState()
    .placedUnits.find((u) => u.id === "a")!;
  expect(restored.x).toBe(0);
  expect(pathOf(first).points[0].x).toBeCloseTo(0, 6);
});
