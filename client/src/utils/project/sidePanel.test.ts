import {
  clampPanelWidth,
  DEFAULT_PANEL_PREFS,
  MAP_MIN_WIDTH,
  PANEL_DEFAULT_WIDTH,
  PANEL_MAX_WIDTH,
  PANEL_MIN_WIDTH,
  parsePanelPrefs,
  RAIL_WIDTH,
  sideWidth,
  tabAfterClick,
} from "./sidePanel";

test("clicking a tab opens it, and clicking the open tab closes the panel", () => {
  expect(tabAfterClick(null, "build")).toBe("build");
  expect(tabAfterClick("scenes", "build")).toBe("build");
  expect(tabAfterClick("build", "build")).toBeNull();
});

test("the panel width stays between its limits and leaves the map room", () => {
  expect(clampPanelWidth(100, 2000)).toBe(PANEL_MIN_WIDTH);
  expect(clampPanelWidth(5000, 2000)).toBe(PANEL_MAX_WIDTH);
  expect(clampPanelWidth(333.4, 2000)).toBe(333);
  // A narrow window: the map keeps its room
  const narrow = RAIL_WIDTH + MAP_MIN_WIDTH + 300;
  expect(clampPanelWidth(500, narrow)).toBe(300);
  // A very narrow window still gets the smallest panel
  expect(clampPanelWidth(500, 400)).toBe(PANEL_MIN_WIDTH);
  expect(clampPanelWidth(NaN, 2000)).toBe(PANEL_DEFAULT_WIDTH);
});

test("the side takes the rail, plus the panel while it's open", () => {
  expect(sideWidth(false, 320)).toBe(RAIL_WIDTH);
  expect(sideWidth(true, 320)).toBe(RAIL_WIDTH + 320);
});

test("remembered panel settings are read back, and anything broken falls back", () => {
  expect(parsePanelPrefs(null)).toEqual(DEFAULT_PANEL_PREFS);
  expect(parsePanelPrefs("not json")).toEqual(DEFAULT_PANEL_PREFS);
  expect(
    parsePanelPrefs(
      JSON.stringify({ tab: "shots", open: true, width: 400, library: "tools" })
    )
  ).toEqual({ tab: "shots", open: true, width: 400, library: "tools" });
  expect(
    parsePanelPrefs(JSON.stringify({ tab: "nope", width: "wide", library: 3 }))
  ).toEqual(DEFAULT_PANEL_PREFS);
});

test("a tab remembered from before the six tabs opens the panel it moved to", () => {
  expect(parsePanelPrefs(JSON.stringify({ tab: "assets" })).tab).toBe(
    "library"
  );
  expect(parsePanelPrefs(JSON.stringify({ tab: "scene" })).tab).toBe("scenes");
  expect(parsePanelPrefs(JSON.stringify({ tab: "drawing" })).tab).toBe("build");
  expect(parsePanelPrefs(JSON.stringify({ tab: "animations" })).tab).toBe(
    "animate"
  );
});
