import { useMapStore } from "./useMapStore";
import {
  currentMoment,
  isPastStart,
  useTimelineStore,
} from "./useTimelineStore";
import { MIN_SPAN_DAYS } from "../utils/marches";
import { DEFAULT_STORY_START } from "../utils/convertProject";
import { Unit } from "../types";

const line = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
];

const S = DEFAULT_STORY_START;

beforeEach(() => {
  useMapStore.getState().resetMapState();
  useTimelineStore.getState().reset();
});

test("dating a march is one undo step", () => {
  const id = useMapStore.getState().addPath(line);
  const stepsBefore = useMapStore.getState().past.length;

  useMapStore
    .getState()
    .setMarchTiming(id, { start: S + 2, end: S + 9, turn: 1 });
  expect(useMapStore.getState().paths[0].march).toEqual({
    start: S + 2,
    end: S + 9,
    turn: 1,
  });
  expect(useMapStore.getState().past.length).toBe(stepsBefore + 1);

  useMapStore.getState().undo();
  expect(useMapStore.getState().paths[0].march).toBeUndefined();
});

test("a march can't begin before the story, end before it begins, or turn for longer than it lasts", () => {
  const id = useMapStore.getState().addPath(line);

  useMapStore
    .getState()
    .setMarchTiming(id, { start: S - 4, end: S + 1, turn: 0 });
  expect(useMapStore.getState().paths[0].march).toEqual({
    start: S,
    end: S + 5,
    turn: 0,
  });

  useMapStore
    .getState()
    .setMarchTiming(id, { start: S + 3, end: S + 1, turn: 2 });
  expect(useMapStore.getState().paths[0].march).toEqual({
    start: S + 3,
    end: S + 3 + MIN_SPAN_DAYS,
    turn: 0,
  });

  useMapStore.getState().setMarchTiming(id, { start: S, end: S + 2, turn: 5 });
  expect(useMapStore.getState().paths[0].march!.turn).toBeCloseTo(
    2 - MIN_SPAN_DAYS,
    9
  );
});

test("units attached with no earlier marches set off when the story starts", () => {
  const unit: Unit = {
    id: "a",
    filename: "a.png",
    path: "a.png",
    assetType: "units",
    x: 0,
    y: 0,
    rotation: 90,
    scale: 1,
  };
  useMapStore.getState().setStoryStart(S + 100);
  useMapStore.getState().setPlacedUnits([unit]);
  useMapStore.getState().boxSelect(["a"]);
  const id = useMapStore.getState().addPath(line);
  useMapStore.getState().attachSelectedUnitsToPath(id);

  const march = useMapStore.getState().paths[0].march!;
  expect(march.start).toBe(S + 100);
  expect(march.end).toBeGreaterThan(march.start);
  expect(march.turn).toBe(0); // already facing the way it goes
});

test("the story's start, display and pacing load without undo steps, and reset to defaults", () => {
  const map = useMapStore.getState();
  map.setStoryStart(S + 10);
  map.setDisplayMode("times");
  map.setPacing([{ seconds: 0, time: S }]);
  expect(useMapStore.getState().past).toHaveLength(0);

  map.resetMapState();
  const state = useMapStore.getState();
  expect(state.storyStart).toBe(S);
  expect(state.displayMode).toBe("months");
  expect(state.pacing).toEqual([]);
});

test("the playhead starts at the story's start, and only counts as past it once it moves on", () => {
  const timeline = useTimelineStore.getState();
  expect(useTimelineStore.getState().now).toBeNull();
  expect(currentMoment(null, S)).toBe(S);
  expect(isPastStart(null, S)).toBe(false);

  timeline.setNow(S + 3);
  expect(currentMoment(useTimelineStore.getState().now, S)).toBe(S + 3);
  expect(isPastStart(S + 3, S)).toBe(true);
  expect(isPastStart(S, S)).toBe(false);

  timeline.play();
  expect(useTimelineStore.getState().playing).toBe(true);
  timeline.pause();
  expect(useTimelineStore.getState().playing).toBe(false);
});

test("resetting goes back to the start and fits the view, but keeps the pace", () => {
  const timeline = useTimelineStore.getState();
  timeline.setPace(7);
  timeline.setNow(S + 5);
  timeline.setView({ from: S, to: S + 1 });
  timeline.play();
  timeline.setDraftTiming({
    pathId: "p",
    timing: { start: S, end: S + 1, turn: 0 },
  });

  timeline.reset();
  const state = useTimelineStore.getState();
  expect(state.now).toBeNull();
  expect(state.playing).toBe(false);
  expect(state.draftTiming).toBeNull();
  expect(state.view).toBeNull();
  expect(state.pace).toBe(7);
});
