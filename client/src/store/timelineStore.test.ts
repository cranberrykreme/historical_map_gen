import {
  clampRowsHeight,
  DEFAULT_ROWS_HEIGHT,
  MIN_ROWS_HEIGHT,
  useTimelineStore,
} from "./useTimelineStore";

const timeline = () => useTimelineStore.getState();

beforeEach(() => {
  timeline().setRowFilter("all");
  timeline().setRowsHeight(DEFAULT_ROWS_HEIGHT);
  timeline().reset();
});

test("the rows area keeps between its smallest height and most of the window", () => {
  expect(clampRowsHeight(10, 1000)).toBe(MIN_ROWS_HEIGHT);
  expect(clampRowsHeight(300, 1000)).toBe(300);
  expect(clampRowsHeight(900, 1000)).toBe(700);
  // A tiny window still leaves the smallest height
  expect(clampRowsHeight(300, 50)).toBe(MIN_ROWS_HEIGHT);
});

test("groups fold and unfold", () => {
  timeline().toggleGroup("A");
  timeline().toggleGroup("B");
  expect(timeline().collapsedGroups).toEqual(["A", "B"]);
  timeline().toggleGroup("A");
  expect(timeline().collapsedGroups).toEqual(["B"]);
  timeline().expandGroup("B");
  timeline().expandGroup("C"); // already open: nothing happens
  expect(timeline().collapsedGroups).toEqual([]);
});

test("opening another project unfolds the groups but keeps the filter and the height", () => {
  timeline().setRowFilter("now");
  timeline().setRowsHeight(320);
  timeline().toggleGroup("A");
  timeline().setNow(42);

  timeline().reset();

  expect(timeline().now).toBeNull();
  expect(timeline().collapsedGroups).toEqual([]);
  expect(timeline().rowFilter).toBe("now");
  expect(timeline().rowsHeight).toBe(320);
});

test("remembering the filter and the height never throws, with or without browser storage", () => {
  expect(() => timeline().setRowFilter("view")).not.toThrow();
  expect(() => timeline().saveRowsHeight()).not.toThrow();
  expect(timeline().rowFilter).toBe("view");
});

test("switching between history and video stops playback; the video playhead never goes below 0", () => {
  timeline().play();
  timeline().setMode("video");
  expect(timeline().mode).toBe("video");
  expect(timeline().playing).toBe(false);

  // Choosing the mode it is already in changes nothing
  timeline().play();
  timeline().setMode("video");
  expect(timeline().playing).toBe(true);
  timeline().pause();

  timeline().setVideoTime(-3);
  expect(timeline().videoTime).toBe(0);
  timeline().setVideoTime(12.5);
  expect(timeline().videoTime).toBe(12.5);
});

test("opening another project goes back to history mode at the video's start", () => {
  timeline().setMode("video");
  timeline().setVideoTime(30);
  timeline().reset();
  expect(timeline().mode).toBe("history");
  expect(timeline().videoTime).toBe(0);
});
