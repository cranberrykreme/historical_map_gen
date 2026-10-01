import { useMapStore } from "./useMapStore";
import { Unit } from "../types";

const unit = (id: string, path: string, extra: Partial<Unit> = {}): Unit => ({
  id,
  filename: path,
  path,
  assetType: "units",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  ...extra,
});

const byId = (id: string) =>
  useMapStore.getState().placedUnits.find((u) => u.id === id)!;

beforeEach(() => {
  useMapStore.getState().resetMapState();
});

test("setting forwards changes only that unit, as one undo step", () => {
  useMapStore
    .getState()
    .setPlacedUnits([
      unit("a", "Army.png"),
      unit("b", "Army.png"),
      unit("c", "Archers.png"),
    ]);

  useMapStore.getState().setUnitForward("a", 90);
  expect(byId("a").forwardAngle).toBe(90);
  expect(byId("b").forwardAngle).toBeUndefined();
  expect(byId("c").forwardAngle).toBeUndefined();

  useMapStore.getState().undo();
  expect(byId("a").forwardAngle).toBeUndefined();
});

test("a pasted copy keeps its own facing, so changing one does not change the other", () => {
  useMapStore
    .getState()
    .setPlacedUnits([unit("a", "Army.png", { forwardAngle: 45 })]);
  useMapStore.getState().selectUnit("a");
  useMapStore.getState().copySelectedUnits();
  useMapStore.getState().pasteUnits();

  const pasted = useMapStore.getState().placedUnits[1];
  expect(pasted.forwardAngle).toBe(45);

  useMapStore.getState().setUnitForward(pasted.id, -90);
  expect(byId("a").forwardAngle).toBe(45);
  expect(byId(pasted.id).forwardAngle).toBe(-90);
});

test("a new unit inherits the facing of the most recently placed unit of the same asset", () => {
  useMapStore
    .getState()
    .setPlacedUnits([
      unit("a", "Army.png", { forwardAngle: -90 }),
      unit("b", "Army.png", { forwardAngle: 0 }),
    ]);

  useMapStore.getState().addUnitAtPosition("Army.png", "units", 10, 10);
  expect(useMapStore.getState().placedUnits[2].forwardAngle).toBe(0);

  useMapStore.getState().addUnitAtPosition("Archers.png", "units", 20, 20);
  expect(useMapStore.getState().placedUnits[3].forwardAngle).toBeUndefined();
});
