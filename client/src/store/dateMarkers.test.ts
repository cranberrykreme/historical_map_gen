import { useMapStore } from "./useMapStore";

const hastings = { year: 1066, month: 10, day: 14 };

beforeEach(() => {
  useMapStore.getState().resetMapState();
});

test("adding a date marker is one undo step, and redo brings it back", () => {
  const stepsBefore = useMapStore.getState().past.length;
  const id = useMapStore.getState().addDateMarker(5, hastings);

  expect(useMapStore.getState().dateMarkers).toEqual([
    { id, time: 5, ...hastings },
  ]);
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);

  useMapStore.getState().undo();
  expect(useMapStore.getState().dateMarkers).toEqual([]);

  useMapStore.getState().redo();
  expect(useMapStore.getState().dateMarkers).toHaveLength(1);
});

test("updating a marker keeps its date valid, and undo restores it", () => {
  const id = useMapStore
    .getState()
    .addDateMarker(2, { year: 1066, month: 1, day: 31 });

  useMapStore.getState().updateDateMarker(id, { month: 2, time: -3 });
  const updated = useMapStore.getState().dateMarkers[0];
  expect(updated.month).toBe(2);
  expect(updated.day).toBe(28); // there is no 31 February
  expect(updated.time).toBe(0);

  useMapStore.getState().undo();
  const restored = useMapStore.getState().dateMarkers[0];
  expect(restored).toEqual({ id, time: 2, year: 1066, month: 1, day: 31 });
});

test("deleting a marker can be undone", () => {
  const id = useMapStore.getState().addDateMarker(2, hastings);
  useMapStore.getState().deleteDateMarker(id);
  expect(useMapStore.getState().dateMarkers).toEqual([]);

  useMapStore.getState().undo();
  expect(useMapStore.getState().dateMarkers).toHaveLength(1);
});

test("loading markers and changing the display mode do not add undo steps", () => {
  const stepsBefore = useMapStore.getState().past.length;

  useMapStore.getState().setDateMarkers([{ id: "m", time: 1, ...hastings }]);
  useMapStore.getState().setDateMode("days");

  expect(useMapStore.getState().past.length).toBe(stepsBefore);
  expect(useMapStore.getState().dateMarkers).toHaveLength(1);
  expect(useMapStore.getState().dateMode).toBe("days");
});

test("resetting clears the markers and goes back to showing months", () => {
  useMapStore.getState().addDateMarker(2, hastings);
  useMapStore.getState().setDateMode("days");

  useMapStore.getState().resetMapState();
  expect(useMapStore.getState().dateMarkers).toEqual([]);
  expect(useMapStore.getState().dateMode).toBe("months");
});
