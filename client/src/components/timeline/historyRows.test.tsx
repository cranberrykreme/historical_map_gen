import React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import Timeline from "./Timeline";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { blockUnit } from "../../utils/units/blocks";
import { MapPath, Shot } from "../../types";

// React needs this to know act() is in charge of updates in tests
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no ResizeObserver
class NoResize {
  observe() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= NoResize;

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  useMapStore.getState().resetMapState();
  useTimelineStore.getState().reset();
  useTimelineStore.getState().setRowFilter("everything");
  useTimelineStore.getState().setExpanded(true);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
// This is React's own root, not Testing Library's render, so it does need act()
const show = (element: React.ReactElement) =>
  // eslint-disable-next-line testing-library/no-unnecessary-act
  act(() => root.render(element));
const text = () => container.textContent ?? "";
const press = (el: Element, init: MouseEventInit = {}) =>
  act(() => {
    el.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, button: 0, ...init })
    );
    window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, ...init }));
  });
const byText = (selector: string, label: string) =>
  Array.from(container.querySelectorAll(selector)).find(
    (el) => el.textContent === label
  )!;

const S = 1000;
function project() {
  const knights = blockUnit(
    { kind: "horse", colour: "red", width: 40, depth: 10, name: "Knights" },
    0,
    0,
    "k"
  );
  const fyrd = {
    ...blockUnit(
      { kind: "foot", colour: "blue", width: 40, depth: 10, name: "Fyrd" },
      0,
      0,
      "f"
    ),
    appears: S + 2,
    leaves: S + 6,
  };
  const scouts = blockUnit(
    { kind: "plain", colour: "green", width: 10, depth: 10, name: "Scouts" },
    0,
    0,
    "s"
  );
  const march: MapPath = {
    id: "m",
    name: "To the hill",
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ],
    assignments: [{ unitId: "k", forward: 0, right: 0 }],
    march: { start: S + 1, end: S + 3, turn: 0 },
  };
  const shots: Shot[] = [
    { id: "a", name: "Opening", seconds: 5, from: S, to: S + 2 },
    { id: "t", name: "Title", seconds: 3, from: S + 2, to: S + 2 },
  ];
  act(() => {
    const map = useMapStore.getState();
    map.setStoryStart(S);
    map.setPlacedUnits([knights, fyrd, scouts]);
    map.setPaths([march]);
    map.setArmies([{ id: "N", name: "Normans", members: [{ unitId: "k" }] }]);
    map.setShots(shots);
  });
}

describe("History mode", () => {
  it("has a shots lane, then a row per unit grouped by army", () => {
    project();
    show(<Timeline />);
    for (const words of [
      "Shots",
      "Opening",
      "Title",
      "Normans",
      "Knights",
      "No army",
      "Fyrd",
      "Scouts",
    ])
      expect(text()).toContain(words);
    // Arrives and leaves show as diamonds on Fyrd's row
    expect(container.querySelectorAll("[class*=rowArrives]")).toHaveLength(1);
    expect(container.querySelectorAll("[class*=rowLeaves]")).toHaveLength(1);
  });

  it("selects a unit from its name, and a shot from its bracket", () => {
    project();
    show(<Timeline />);
    press(byText("div", "Scouts"));
    expect(Array.from(useMapStore.getState().selectedUnitIds)).toEqual(["s"]);
    press(byText("span", "Opening").parentElement!);
    expect(useMapStore.getState().selectedShotId).toBe("a");
  });

  it("Marches lists only the units that march; Battle and Map wait for later weeks", () => {
    project();
    show(<Timeline />);
    press(byText("button", "Marches"));
    expect(text()).toContain("Knights");
    expect(text()).not.toContain("Scouts");
    expect((byText("button", "Battle") as HTMLButtonElement).disabled).toBe(
      true
    );
    expect((byText("button", "Map") as HTMLButtonElement).disabled).toBe(true);
  });

  it("adds a shot from the lane's + button", () => {
    project();
    show(<Timeline />);
    press(container.querySelector("[class*=laneAdd]")!);
    expect(useMapStore.getState().shots).toHaveLength(3);
  });

  it("clicking a diamond moves the playhead there", () => {
    project();
    show(<Timeline />);
    press(container.querySelector("[class*=rowLeaves]")!);
    expect(useTimelineStore.getState().now).toBe(S + 6);
    expect(Array.from(useMapStore.getState().selectedUnitIds)).toEqual(["f"]);
  });
});
