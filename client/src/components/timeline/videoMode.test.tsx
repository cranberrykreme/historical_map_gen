import React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import Timeline from "./Timeline";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { Shot } from "../../types";

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
  useTimelineStore.getState().setExpanded(true);
  useTimelineStore.setState({
    foldedLanes: ["overlays", "narration", "music", "effects"],
  });
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
const fire = (el: Element, type: string, init: MouseEventInit = {}) =>
  act(() => {
    el.dispatchEvent(
      new MouseEvent(type, { bubbles: true, button: 0, ...init })
    );
  });
const click = (el: Element) => {
  fire(el, "mousedown");
  act(() => {
    window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
  fire(el, "click");
};
const byText = (selector: string, label: string) =>
  Array.from(container.querySelectorAll(selector)).find(
    (el) => el.textContent === label
  )!;
const shotBlock = (name: string) =>
  Array.from(container.querySelectorAll("[class*=shotBlock]")).find((el) =>
    el.textContent?.includes(name)
  )!;

const S = 1000;
function project() {
  const shots: Shot[] = [
    {
      id: "a",
      name: "Opening",
      seconds: 4,
      from: S,
      to: S + 2,
      chapter: "Arrival",
    },
    { id: "b", name: "Landing", seconds: 6, from: S + 2, to: S + 3 },
  ];
  act(() => {
    const map = useMapStore.getState();
    map.setStoryStart(S);
    map.setShots(shots);
    useTimelineStore.getState().setMode("video");
  });
}

describe("Video mode", () => {
  it("shows the video's length, chapters, shots and folded lanes", () => {
    project();
    show(<Timeline />);
    for (const words of [
      "Video",
      "0:10",
      "Chapters",
      "Arrival",
      "Shots",
      "Opening",
      "Landing",
      "Overlays",
      "Music",
    ])
      expect(text()).toContain(words);
    // Folded lanes don't say what's coming until they're opened
    expect(text()).not.toContain("arrive in week");
  });

  it("opens a folded lane to say what will go on it", () => {
    project();
    show(<Timeline />);
    const music = byText("span", "Music").parentElement!;
    click(music.querySelector("button")!);
    expect(useTimelineStore.getState().foldedLanes).not.toContain("music");
    expect(text()).toContain("Music arrive in week 10");
  });

  it("double-clicking a shot opens it; ← All shots goes back", () => {
    project();
    show(<Timeline />);
    fire(shotBlock("Landing"), "dblclick");
    expect(useTimelineStore.getState().openShotId).toBe("b");
    expect(text()).toContain("← All shots");
    expect(text()).toContain("Camera");
    click(byText("button", "← All shots"));
    expect(useTimelineStore.getState().openShotId).toBeNull();
    expect(text()).toContain("Chapters");
  });

  it("Escape closes an open shot", () => {
    project();
    show(<Timeline />);
    fire(shotBlock("Opening"), "dblclick");
    expect(text()).toContain("← All shots");
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    });
    expect(useTimelineStore.getState().openShotId).toBeNull();
  });

  it("the + Row menu lists the rows later weeks add", () => {
    project();
    show(<Timeline />);
    fire(shotBlock("Opening"), "dblclick");
    click(byText("button", "+ Row"));
    expect(text()).toContain("Characters");
    expect(text()).toContain("week 9.9");
  });

  it("clicking in an open shot's rows moves the playhead within that shot", () => {
    project();
    show(<Timeline />);
    fire(shotBlock("Landing"), "dblclick");
    const tracks = container.querySelector("[class*=tracks]")!;
    tracks.getBoundingClientRect = () =>
      ({ left: 0, width: 600, top: 0, height: 100 }) as DOMRect;
    // Halfway along Landing's 6 seconds, which starts 4 seconds into the video
    fire(tracks, "mousedown", { clientX: 300 });
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });
    expect(useTimelineStore.getState().videoTime).toBe(7);
    expect(useMapStore.getState().selectedShotId).toBe("b");
  });
});
