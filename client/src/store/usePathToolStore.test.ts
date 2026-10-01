import { usePathToolStore } from "./usePathToolStore";
import { useMapStore } from "./useMapStore";

beforeEach(() => {
  useMapStore.getState().resetMapState();
  usePathToolStore.setState({
    drawingPoints: null,
    draftPath: null,
    selectedWaypoint: null,
    playbackSpeed: 1,
  });
});

test("finishing with fewer than two points does nothing", () => {
  const tool = usePathToolStore.getState();
  tool.startDrawing();
  tool.addDrawingPoint({ x: 0, y: 0 });
  tool.finishDrawing();

  expect(useMapStore.getState().paths).toHaveLength(0);
  expect(usePathToolStore.getState().drawingPoints).toHaveLength(1);
});

test("a repeated click on the same spot is ignored", () => {
  const tool = usePathToolStore.getState();
  tool.startDrawing();
  tool.addDrawingPoint({ x: 10, y: 10 });
  tool.addDrawingPoint({ x: 10.2, y: 10.1 });

  expect(usePathToolStore.getState().drawingPoints).toHaveLength(1);
});

test("finishing turns the points into a selected path and leaves drawing mode", () => {
  const tool = usePathToolStore.getState();
  tool.startDrawing();
  tool.addDrawingPoint({ x: 0, y: 0 });
  tool.addDrawingPoint({ x: 100, y: 50 });
  tool.finishDrawing();

  const { paths, selectedPathId } = useMapStore.getState();
  expect(paths).toHaveLength(1);
  expect(paths[0].points).toEqual([
    { x: 0, y: 0 },
    { x: 100, y: 50 },
  ]);
  expect(selectedPathId).toBe(paths[0].id);
  expect(usePathToolStore.getState().drawingPoints).toBeNull();
});

test("inserting a waypoint puts it in the right place and selects it", () => {
  const id = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ]);
  usePathToolStore.getState().insertWaypoint(id, 0, { x: 50, y: 20 });

  expect(useMapStore.getState().paths[0].points).toEqual([
    { x: 0, y: 0 },
    { x: 50, y: 20 },
    { x: 100, y: 0 },
  ]);
  expect(usePathToolStore.getState().selectedWaypoint).toEqual({
    pathId: id,
    index: 1,
  });
});

test("deleting the selected waypoint works, but a path keeps at least two", () => {
  const id = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 50, y: 50 },
    { x: 100, y: 0 },
  ]);

  usePathToolStore.getState().selectWaypoint(id, 1);
  expect(usePathToolStore.getState().deleteSelectedWaypoint()).toBe(true);
  expect(useMapStore.getState().paths[0].points).toHaveLength(2);

  usePathToolStore.getState().selectWaypoint(id, 0);
  expect(usePathToolStore.getState().deleteSelectedWaypoint()).toBe(false);
  expect(useMapStore.getState().paths[0].points).toHaveLength(2);
});

test("a finished drag is a single undo step", () => {
  const id = useMapStore.getState().addPath([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ]);
  const stepsBefore = useMapStore.getState().past.length;

  const tool = usePathToolStore.getState();
  tool.setDraftPath({
    id,
    points: [
      { x: 0, y: 0 },
      { x: 120, y: 40 },
    ],
  });
  tool.commitDraftPath();

  expect(useMapStore.getState().paths[0].points[1]).toEqual({ x: 120, y: 40 });
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);
  expect(usePathToolStore.getState().draftPath).toBeNull();

  useMapStore.getState().undo();
  expect(useMapStore.getState().paths[0].points[1]).toEqual({ x: 100, y: 0 });
});

test("preview progress is clamped between 0 and 1 and can be cleared", () => {
  usePathToolStore.getState().setPreview("p", 1.7);
  expect(usePathToolStore.getState().preview).toEqual({
    pathId: "p",
    progress: 1,
  });

  usePathToolStore.getState().setPreview("p", -2);
  expect(usePathToolStore.getState().preview?.progress).toBe(0);

  usePathToolStore.getState().clearPreview();
  expect(usePathToolStore.getState().preview).toBeNull();
});

test("starting to draw ends any preview", () => {
  usePathToolStore.getState().setPreview("p", 0.5);
  usePathToolStore.getState().startDrawing();
  expect(usePathToolStore.getState().preview).toBeNull();
});

test("playback speed defaults to 1x and can be changed", () => {
  expect(usePathToolStore.getState().playbackSpeed).toBe(1);
  usePathToolStore.getState().setPlaybackSpeed(0.5);
  expect(usePathToolStore.getState().playbackSpeed).toBe(0.5);
});
