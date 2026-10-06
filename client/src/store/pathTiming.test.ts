import { useMapStore } from "./useMapStore";
import { useTimelineStore } from "./useTimelineStore";
import { MIN_MOVEMENT_SECONDS } from "../utils/timeline";

const line = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
];

beforeEach(() => {
  useMapStore.getState().resetMapState();
  useTimelineStore.getState().reset();
});

test("setting a movement's timing is one undo step", () => {
  const id = useMapStore.getState().addPath(line);
  const stepsBefore = useMapStore.getState().past.length;

  useMapStore.getState().setPathTiming(id, 2, 9);
  expect(useMapStore.getState().paths[0].start).toBe(2);
  expect(useMapStore.getState().paths[0].end).toBe(9);
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);

  useMapStore.getState().undo();
  expect(useMapStore.getState().paths[0].start).toBeUndefined();
});

test("a timing can't start before 0 or be shorter than the minimum", () => {
  const id = useMapStore.getState().addPath(line);
  useMapStore.getState().setPathTiming(id, -4, 0.1);

  expect(useMapStore.getState().paths[0].start).toBe(0);
  expect(useMapStore.getState().paths[0].end).toBe(MIN_MOVEMENT_SECONDS);
});

test("play and pause toggle playing, and the time never goes below 0", () => {
  const timeline = useTimelineStore.getState();

  timeline.play();
  expect(useTimelineStore.getState().playing).toBe(true);
  timeline.pause();
  expect(useTimelineStore.getState().playing).toBe(false);

  timeline.setTime(-3);
  expect(useTimelineStore.getState().time).toBe(0);
  timeline.setTime(4.5);
  expect(useTimelineStore.getState().time).toBe(4.5);
});

test("resetting goes back to the start but keeps the speed", () => {
  const timeline = useTimelineStore.getState();
  timeline.setSpeed(2);
  timeline.setTime(5);
  timeline.play();
  timeline.setDraftTiming({ pathId: "p", timing: { start: 1, end: 2 } });

  timeline.reset();
  const state = useTimelineStore.getState();
  expect(state.time).toBe(0);
  expect(state.playing).toBe(false);
  expect(state.draftTiming).toBeNull();
  expect(state.speed).toBe(2);
});
