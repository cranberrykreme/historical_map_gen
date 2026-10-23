import React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { useMapStore } from "../../store/useMapStore";
import { blockUnit, newBlockSpec } from "../../utils/units/blocks";
import { Unit } from "../../types";
import ScenesPanel from "./ScenesPanel";
import LibraryPanel from "./LibraryPanel";
import BuildPanel from "./BuildPanel";
import AnimationsPanel from "./AnimationsPanel";
import ShotsPanel from "./ShotsPanel";
import Toolbar from "./Toolbar";
import ProjectHeader from "../project/ProjectHeader";
import { useSidePanelStore } from "../../store/useSidePanelStore";

// Jest here can't load react-router's newer package layout; the header only needs useNavigate
jest.mock("react-router-dom", () => ({ useNavigate: () => () => {} }));

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

// An open land battle with a block that thins and dies, and a unit that joins an army late
function openBattle() {
  const block: Unit = {
    ...blockUnit(
      newBlockSpec({
        name: "Shield wall",
        losses: [{ start: 100, end: 101, share: 0.5 }],
      }),
      0,
      0,
      "b1"
    ),
    leaves: 102,
    exit: { style: "shatter", marker: "cross" },
  };
  const state = useMapStore.getState();
  state.setPlacedUnits([block]);
  useMapStore.setState({
    battles: [
      { id: "h", name: "Hastings", kind: "land", width: 800, height: 600 },
    ],
    activeSceneId: "h",
    armies: [
      { id: "a", name: "Saxons", members: [{ unitId: "b1", joins: 99 }] },
    ],
    selectedUnitIds: new Set(["b1"]),
  });
}

const noop = () => {};
const libraryProps = {
  onAddAsset: noop,
  selectedMapFilename: null,
  onSelectMap: noop,
  onDeleteAsset: noop,
  onAssetRenamed: noop,
  onSelectPsd: noop,
  onSelectPortraitSource: noop,
};
const click = (el: Element) =>
  act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const button = (label: string) =>
  Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(label)
  )!;

test("the Scenes tab groups the scenes by kind and opens one on a click", () => {
  openBattle();
  show(<ScenesPanel />);
  for (const title of ["New scene", "Maps", "Main map", "Battles", "Hastings"])
    expect(text()).toContain(title);
  expect(text()).not.toContain("Marches");
  const mainMap = Array.from(container.querySelectorAll("span")).find(
    (s) => s.textContent === "Main map"
  )!;
  click(mainMap);
  expect(useMapStore.getState().activeSceneId).toBe("map");
});

test("New scene offers land and sea battles, and makes and opens one", () => {
  openBattle();
  show(<ScenesPanel />);
  expect(text()).not.toContain("Sea battle");
  click(button("New scene"));
  expect(text()).toContain("Land battle");
  expect(text()).toContain("Sea battle");
  const sea = Array.from(container.querySelectorAll("span")).find(
    (s) => s.textContent === "Sea battle"
  )!;
  click(sea);
  expect(text()).toContain("New sea battle");
  click(button("Create and open"));
  const { battles, activeSceneId } = useMapStore.getState();
  expect(battles).toHaveLength(2);
  expect(battles[1].kind).toBe("sea");
  expect(activeSceneId).toBe(battles[1].id);
});

test("the Build tab has marches and armies, and terrain only in a battle", () => {
  openBattle();
  show(<BuildPanel />);
  for (const title of [
    "Marches",
    "All marches",
    "New march",
    "Armies",
    "All armies",
    "Terrain: Hastings",
  ])
    expect(text()).toContain(title);
  expect(text()).not.toMatch(/\bpaths?\b/i);
  act(() => useMapStore.setState({ activeSceneId: "map" }));
  expect(text()).toContain("Marches");
  expect(text()).not.toContain("Terrain");
});

test("the Library shows one section at a time; formation blocks are with units", () => {
  openBattle();
  act(() => useSidePanelStore.getState().setLibrarySection("maps"));
  show(<LibraryPanel {...libraryProps} />);
  expect(text()).toContain("No maps yet");
  expect(text()).not.toContain("Formation blocks");
  click(button("Units"));
  expect(text()).toContain("Block: Shield wall");
  act(() => useMapStore.setState({ selectedUnitIds: new Set() }));
  expect(text()).toContain("Formation blocks");
  click(button("Tools"));
  expect(text()).toContain("PSD editor");
  expect(text()).toContain("Portrait maker");
  expect(text()).not.toContain("Add to Library");
});

test("a tab opens on a click and stays open; a second click or Escape closes it", () => {
  jest.useFakeTimers();
  openBattle();
  act(() => useSidePanelStore.getState().close());
  show(<Toolbar {...libraryProps} />);
  for (const word of [
    "Library",
    "Scenes",
    "Build",
    "Animate",
    "Shots",
    "Publish",
  ])
    expect(text()).toContain(word);
  expect(text()).not.toContain("All marches");

  // Hovering doesn't open it
  act(() =>
    button("Build").dispatchEvent(
      new MouseEvent("mouseover", { bubbles: true })
    )
  );
  expect(text()).not.toContain("All marches");

  click(button("Build"));
  expect(text()).toContain("All marches");
  expect(document.documentElement.style.getPropertyValue("--side-width")).toBe(
    `${56 + useSidePanelStore.getState().width}px`
  );

  click(button("Build"));
  expect(text()).not.toContain("All marches");
  expect(document.documentElement.style.getPropertyValue("--side-width")).toBe(
    "56px"
  );

  click(button("Shots"));
  expect(useSidePanelStore.getState().openTab).toBe("shots");
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    jest.runAllTimers();
  });
  expect(useSidePanelStore.getState().openTab).toBeNull();
  expect(useSidePanelStore.getState().lastTab).toBe("shots");
  jest.useRealTimers();
});

test("Escape that something else used leaves the panel open", () => {
  jest.useFakeTimers();
  act(() => useSidePanelStore.getState().open("animate"));
  show(<Toolbar {...libraryProps} />);
  const used = (e: KeyboardEvent) => e.preventDefault();
  window.addEventListener("keydown", used);
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", cancelable: true })
    );
    jest.runAllTimers();
  });
  window.removeEventListener("keydown", used);
  expect(useSidePanelStore.getState().openTab).toBe("animate");
  jest.useRealTimers();
});

test("the Animations tab has the selected units' timing and lists every animation", () => {
  openBattle();
  show(<AnimationsPanel />);
  for (const title of [
    "Selected: 1 unit",
    "Turning along marches",
    "Death and leaving",
    "Shield wall: losses",
    "Arrivals",
    "Deaths and leaving",
    "Block losses",
    "Army joins and leaves",
    "Shield wall: Saxons",
    "Shatter",
  ])
    expect(text()).toContain(title);
});

test("a section folds away when its title is clicked", () => {
  openBattle();
  show(<AnimationsPanel />);
  const title = Array.from(container.querySelectorAll("div")).find(
    (d) => d.firstChild?.textContent === "Army joins and leaves"
  )!;
  expect(text()).toContain("Shield wall: Saxons");
  act(() => title.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(text()).not.toContain("Shield wall: Saxons");
  act(() => title.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(text()).toContain("Shield wall: Saxons");
});

test("the header shows the open battle with a way back to the main map", () => {
  openBattle();
  show(
    <ProjectHeader
      projectName="Test"
      onSave={() => {}}
      onUndo={() => {}}
      canUndo={false}
      saveStatus="idle"
    />
  );
  expect(text()).toContain("Hastings");
  expect(text()).toContain("Land battle");
  const back = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("Main map")
  )!;
  act(() => back.click());
  expect(useMapStore.getState().activeSceneId).toBe("map");
  expect(text()).not.toContain("Hastings");
});

test("the shots tab lists shots by chapter; picking one selects it", () => {
  useMapStore.getState().resetMapState();
  useMapStore.setState({
    shots: [
      { id: "s1", name: "Coast", seconds: 5, from: 0, to: 1 },
      {
        id: "s2",
        name: "Ships land",
        seconds: 10,
        from: 1,
        to: 2,
        chapter: "Landing",
      },
      { id: "s3", name: "Camp", seconds: 10, from: 2, to: 3 },
    ],
  });
  show(<ShotsPanel />);
  expect(text()).toContain("Opening");
  expect(text()).toContain("Landing");
  expect(text()).toContain("Ships land");
  const camp = Array.from(container.querySelectorAll("div")).find((d) =>
    d.title?.startsWith("Camp:")
  )!;
  act(() => {
    camp.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    window.dispatchEvent(new MouseEvent("mouseup"));
  });
  expect(useMapStore.getState().selectedShotId).toBe("s3");

  // Folding the chapter hides its shots
  const heading = Array.from(container.querySelectorAll("div")).find((d) =>
    d.title?.startsWith("Click to fold")
  )!;
  act(() => heading.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(text()).not.toContain("Ships land");
});
