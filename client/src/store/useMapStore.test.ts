import { useMapStore } from "./useMapStore";
import { Unit } from "../types";

const unit = (id: string): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
});

const line = [
  { x: 0, y: 0 },
  { x: 100, y: 100 },
];

// A path with both units in its formation
function pathWithBothUnits() {
  useMapStore.getState().setPlacedUnits([unit("a"), unit("b")]);
  useMapStore.getState().addPath(line);
  const [path] = useMapStore.getState().paths;
  useMapStore.getState().setPaths([
    {
      ...path,
      assignments: [
        { unitId: "a", forward: 0, right: 0 },
        { unitId: "b", forward: 0, right: 10 },
      ],
    },
  ]);
}

beforeEach(() => {
  useMapStore.getState().resetMapState();
});

test("undo and redo move units and paths together", () => {
  useMapStore.getState().setPlacedUnits([unit("a")]);
  useMapStore.getState().addPath(line);
  expect(useMapStore.getState().paths).toHaveLength(1);

  useMapStore.getState().undo();
  expect(useMapStore.getState().paths).toHaveLength(0);
  expect(useMapStore.getState().placedUnits).toHaveLength(1);

  useMapStore.getState().redo();
  expect(useMapStore.getState().paths).toHaveLength(1);
});

test("deleting a unit removes it from a formation, and undo brings it back", () => {
  pathWithBothUnits();
  useMapStore.getState().selectUnit("a");
  useMapStore.getState().removeSelectedUnits();

  expect(
    useMapStore.getState().paths[0].assignments.map((a) => a.unitId)
  ).toEqual(["b"]);

  useMapStore.getState().undo();
  expect(useMapStore.getState().paths[0].assignments).toHaveLength(2);
});

test("deleting an asset removes its units from formations", () => {
  pathWithBothUnits();
  useMapStore.getState().cleanupDeletedAsset("a.png", "units");

  expect(useMapStore.getState().placedUnits.map((u) => u.id)).toEqual(["b"]);
  expect(
    useMapStore.getState().paths[0].assignments.map((a) => a.unitId)
  ).toEqual(["b"]);
});

test("deleting the selected path clears the selection, and undo restores the path", () => {
  const id = useMapStore.getState().addPath(line);
  expect(useMapStore.getState().selectedPathId).toBe(id);

  useMapStore.getState().deletePath(id);
  expect(useMapStore.getState().paths).toHaveLength(0);
  expect(useMapStore.getState().selectedPathId).toBeNull();

  useMapStore.getState().undo();
  expect(useMapStore.getState().paths).toHaveLength(1);
});
