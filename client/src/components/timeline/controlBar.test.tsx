import React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import Transport from "./Transport";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { useSidePanelStore } from "../../store/useSidePanelStore";
import useSaveProject from "../../hooks/useSaveProject";
import { AUTOSAVE_DELAY } from "../../utils/project/autosave";
import { Shot } from "../../types";

// React needs this to know act() is in charge of updates in tests
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  useMapStore.getState().resetMapState();
  useTimelineStore.getState().reset();
  useSidePanelStore.getState().close();
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
const button = (label: string) =>
  Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === label
  )!;
const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

const shot = { id: "s1" } as unknown as Shot;
const bar = () => (
  <Transport current={0} hasMarches={true} storyEnd={10} firstMarch={5} />
);

describe("control bar", () => {
  it("has the pace as one dropdown, and no date or shape buttons", () => {
    show(bar());
    const select = container.querySelector("select")!;
    expect(select.selectedOptions[0].textContent).toBe("1 day / sec");
    act(() => {
      select.value = "3";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(useTimelineStore.getState().pace).toBe(7);
    expect(text()).not.toContain("Months");
    expect(text()).not.toContain("16:9");
  });

  it("opens Publish from Render once there are shots", () => {
    show(bar());
    expect(button("Render ▸").disabled).toBe(true);
    act(() => useMapStore.setState({ shots: [shot] }));
    click(button("Render ▸"));
    expect(useSidePanelStore.getState().openTab).toBe("publish");
  });

  it("keeps the video's shape, date style and story start in the settings popup", () => {
    show(bar());
    click(button("⚙"));
    expect(text()).toContain("Video settings");
    click(button("9:16"));
    expect(useMapStore.getState().videoFrame).toBe("portrait");
    click(button("Days"));
    expect(useMapStore.getState().displayMode).toBe("days");
    expect(text()).toContain("Story starts");
  });

  it("closes the settings popup with Escape, leaving the side panel alone", () => {
    show(bar());
    click(button("⚙"));
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      cancelable: true,
    });
    act(() => {
      window.dispatchEvent(event);
    });
    expect(text()).not.toContain("Video settings");
    expect(event.defaultPrevented).toBe(true);
  });
});

describe("autosave", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function Saver({
    save,
    loaded,
  }: {
    save: () => Promise<boolean>;
    loaded: boolean;
  }) {
    const { markLoaded } = useSaveProject(save, { current: null });
    React.useEffect(() => {
      if (loaded) markLoaded();
    }, [loaded, markLoaded]);
    return null;
  }

  const passTime = (ms: number) =>
    act(() => {
      jest.advanceTimersByTime(ms);
    });

  it("saves a moment after an edit, once the project has loaded", () => {
    const save = jest.fn(() => Promise.resolve(true));
    show(<Saver save={save} loaded={true} />);
    act(() => useMapStore.getState().setStoryStart(3));
    passTime(AUTOSAVE_DELAY - 400);
    expect(save).not.toHaveBeenCalled();
    passTime(800);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("never saves before the project has loaded", () => {
    const save = jest.fn(() => Promise.resolve(true));
    show(<Saver save={save} loaded={false} />);
    act(() => useMapStore.getState().setStoryStart(3));
    passTime(AUTOSAVE_DELAY * 3);
    expect(save).not.toHaveBeenCalled();
  });

  it("waits while the video plays", () => {
    const save = jest.fn(() => Promise.resolve(true));
    show(<Saver save={save} loaded={true} />);
    act(() => {
      useMapStore.getState().setStoryStart(3);
      useTimelineStore.getState().play();
    });
    passTime(AUTOSAVE_DELAY * 3);
    expect(save).not.toHaveBeenCalled();
    act(() => useTimelineStore.getState().pause());
    passTime(400);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
