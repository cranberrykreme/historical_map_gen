import { useMapStore } from "./useMapStore";
import { Unit } from "../types";
import { playbackState } from "../utils/pathPlayback";

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

const pathOf = (id: string) =>
  useMapStore.getState().paths.find((p) => p.id === id)!;
const byId = (id: string) =>
  useMapStore.getState().placedUnits.find((u) => u.id === id)!;

// Two units either side of the line the path will run along, both selected
function setup() {
  useMapStore
    .getState()
    .setPlacedUnits([unit("a", 50, 20), unit("b", 50, -20)]);
  const id = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 200, y: 0 },
  ]);
  useMapStore.getState().boxSelect(["a", "b"]);
  return id;
}

beforeEach(() => {
  useMapStore.getState().resetMapState();
});

test("attaching moves the path start to the formation centre, as one undo step", () => {
  const id = setup();
  const stepsBefore = useMapStore.getState().past.length;

  expect(useMapStore.getState().attachSelectedUnitsToPath(id)).toBe(true);
  expect(pathOf(id).points[0].x).toBeCloseTo(50, 6);
  expect(pathOf(id).points[0].y).toBeCloseTo(0, 6);
  expect(pathOf(id).assignments).toHaveLength(2);
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);

  useMapStore.getState().undo();
  expect(pathOf(id).points[0]).toEqual({ x: 0, y: 0 });
  expect(pathOf(id).assignments).toHaveLength(0);
});

test("attaching with nothing selected does nothing", () => {
  const id = setup();
  useMapStore.getState().selectUnit(null);
  expect(useMapStore.getState().attachSelectedUnitsToPath(id)).toBe(false);
  expect(pathOf(id).assignments).toHaveLength(0);
});

test("detaching removes one unit from the path, and undo restores it", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);

  useMapStore.getState().detachUnitFromPath(id, "a");
  expect(pathOf(id).assignments.map((a) => a.unitId)).toEqual(["b"]);

  useMapStore.getState().undo();
  expect(pathOf(id).assignments).toHaveLength(2);
});

test("travel mode is set on the chosen units only, as one undo step", () => {
  useMapStore.getState().setPlacedUnits([unit("a", 0, 0), unit("b", 0, 0)]);

  useMapStore.getState().setUnitsTravelMode(["a"], "upright");
  expect(byId("a").travelMode).toBe("upright");
  expect(byId("b").travelMode).toBeUndefined();

  useMapStore.getState().undo();
  expect(byId("a").travelMode).toBeUndefined();
});

test("a new unit inherits the travel mode of the same asset already on the map", () => {
  useMapStore
    .getState()
    .setPlacedUnits([unit("Ship", 0, 0, { travelMode: "upright" })]);

  useMapStore.getState().addUnitAtPosition("Ship.png", "units", 10, 10);
  expect(useMapStore.getState().placedUnits[1].travelMode).toBe("upright");

  useMapStore.getState().addUnitAtPosition("Army.png", "units", 20, 20);
  expect(useMapStore.getState().placedUnits[2].travelMode).toBeUndefined();
});

test("moving every attached unit together moves the path start with them, in one undo step", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);
  const stepsBefore = useMapStore.getState().past.length;

  useMapStore.getState().commitGroupMove(30, 30);
  expect(pathOf(id).points[0].x).toBeCloseTo(80, 6);
  expect(pathOf(id).points[0].y).toBeCloseTo(30, 6);
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);

  useMapStore.getState().undo();
  expect(pathOf(id).points[0].x).toBeCloseTo(50, 6);
  expect(byId("a").x).toBe(50);
});

test("moving one attached unit keeps the path start and re-records its slot", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);

  useMapStore.getState().commitUnitMove("a", 60, 40);
  expect(pathOf(id).points[0].x).toBeCloseTo(50, 6);
  expect(pathOf(id).points[0].y).toBeCloseTo(0, 6);
  const slot = pathOf(id).assignments.find((s) => s.unitId === "a")!;
  // The path heads east, so a point 10 east and 40 south of the start is 10 ahead, 40 to the right
  expect(slot.forward).toBeCloseTo(10, 6);
  expect(slot.right).toBeCloseTo(40, 6);
});

test("editing a path keeps its attached units exactly where they are at the start of playback", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);

  // Bend the route so the start heading changes
  useMapStore
    .getState()
    .updatePathPoints(id, [
      pathOf(id).points[0],
      { x: 120, y: 90 },
      { x: 250, y: 0 },
    ]);

  const state = playbackState(
    pathOf(id),
    useMapStore.getState().placedUnits,
    0
  );
  expect(state.get("a")!.x).toBeCloseTo(50, 5);
  expect(state.get("a")!.y).toBeCloseTo(20, 5);
  expect(state.get("b")!.x).toBeCloseTo(50, 5);
  expect(state.get("b")!.y).toBeCloseTo(-20, 5);
});

test("attaching keeps the formation as placed by default", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);

  expect(pathOf(id).direction).toBeUndefined();
});

test("switching the formation mode re-measures the slots without moving anyone, as one undo step", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);
  const stepsBefore = useMapStore.getState().past.length;

  useMapStore.getState().setFormationMode(id, "wheel");
  expect(pathOf(id).direction).toBeCloseTo(-90, 6);
  expect(pathOf(id).points[0].x).toBeCloseTo(50, 6);
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);

  // Everyone is still exactly where they were placed
  const state = playbackState(
    pathOf(id),
    useMapStore.getState().placedUnits,
    0
  );
  expect(state.get("a")!.x).toBeCloseTo(50, 5);
  expect(state.get("a")!.y).toBeCloseTo(20, 5);

  useMapStore.getState().setFormationMode(id, "keep");
  expect(pathOf(id).direction).toBeUndefined();

  useMapStore.getState().undo();
  expect(pathOf(id).direction).toBeCloseTo(-90, 6);
});

test("re-recording a turning formation follows how the units face now, as one undo step", () => {
  const id = setup();
  useMapStore.getState().attachSelectedUnitsToPath(id);
  useMapStore.getState().setFormationMode(id, "wheel");

  useMapStore.getState().commitGroupRotate(90); // both units now face east
  expect(pathOf(id).direction).toBeCloseTo(-90, 6); // the formation has not followed yet

  useMapStore.getState().refreshPathFormation(id);
  expect(pathOf(id).direction).toBeCloseTo(0, 6);
  expect(pathOf(id).points[0].x).toBeCloseTo(50, 6);

  useMapStore.getState().undo();
  expect(pathOf(id).direction).toBeCloseTo(-90, 6);
});
