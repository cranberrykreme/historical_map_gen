import { useMapStore } from "./useMapStore";
import { useTimelineStore } from "./useTimelineStore";
import { DEFAULT_STORY_START } from "../utils/convertProject";
import { Unit } from "../types";

const S = DEFAULT_STORY_START;

const unit = (id: string, extra: Partial<Unit> = {}): Unit => ({
  id,
  filename: `${id}.png`,
  path: `${id}.png`,
  assetType: "units",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  ...extra,
});

const byId = (id: string) =>
  useMapStore.getState().placedUnits.find((u) => u.id === id);

beforeEach(() => {
  useMapStore.getState().resetMapState();
  useTimelineStore.getState().reset();
});

test("a unit placed at the story's start has no dates; placed later, it appears then", () => {
  useMapStore.getState().addUnitAtPosition("army.png", "units", 10, 20);
  expect(useMapStore.getState().placedUnits[0].appears).toBeUndefined();

  useTimelineStore.getState().setNow(S + 4);
  useMapStore.getState().addUnitAtPosition("army.png", "units", 30, 40);
  const later = useMapStore.getState().placedUnits[1];
  expect(later.appears).toBe(S + 4);
  expect(later.x).toBe(30);
});

test("pasted units appear at the playhead, and don't keep the copied unit's dates", () => {
  useMapStore
    .getState()
    .setPlacedUnits([unit("a", { appears: S + 1, leaves: S + 2 })]);
  useMapStore.getState().boxSelect(["a"]);
  useMapStore.getState().copySelectedUnits();

  useTimelineStore.getState().setNow(S + 7);
  useMapStore.getState().pasteUnits();
  const pasted = useMapStore.getState().placedUnits[1];
  expect(pasted.appears).toBe(S + 7);
  expect(pasted.leaves).toBeUndefined();
});

test("deleting at the start removes a unit; later it leaves, and both are one undo step", () => {
  useMapStore.getState().setPlacedUnits([unit("a"), unit("b")]);

  useTimelineStore.getState().setNow(S + 3);
  useMapStore.getState().boxSelect(["a"]);
  useMapStore.getState().removeSelectedUnits();
  expect(byId("a")!.leaves).toBe(S + 3);

  useTimelineStore.getState().setNow(null);
  useMapStore.getState().boxSelect(["b"]);
  useMapStore.getState().removeSelectedUnits();
  expect(byId("b")).toBeUndefined();

  useMapStore.getState().undo();
  expect(byId("b")).toBeDefined();
  useMapStore.getState().undo();
  expect(byId("a")!.leaves).toBeUndefined();
});

test("a unit that left can be brought back, in one undo step", () => {
  useMapStore
    .getState()
    .setPlacedUnits([unit("a", { leaves: S + 3 }), unit("b")]);
  const before = useMapStore.getState().past.length;

  useMapStore.getState().bringBackUnits(["a", "b"]);
  expect(byId("a")!.leaves).toBeUndefined();
  expect("leaves" in byId("a")!).toBe(false);
  expect(useMapStore.getState().past.length).toBe(before + 1);

  // Nothing to bring back: no undo step
  useMapStore.getState().bringBackUnits(["b"]);
  expect(useMapStore.getState().past.length).toBe(before + 1);
});
