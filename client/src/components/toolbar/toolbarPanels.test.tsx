import React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { useMapStore } from "../../store/useMapStore";
import { blockUnit, newBlockSpec } from "../../utils/units/blocks";
import { Unit } from "../../types";
import ScenePanel from "./ScenePanel";
import AssetsPanel from "./AssetsPanel";
import DrawingPanel from "./DrawingPanel";
import AnimationsPanel from "./AnimationsPanel";
import ShotsPanel from "./ShotsPanel";
import ProjectHeader from "../project/ProjectHeader";

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

test("the Scene tab has three sections, Battles, Paths and Armies, with subsections in each", () => {
  openBattle();
  show(<ScenePanel />);
  for (const title of [
    "Battles",
    "Main map and battles",
    "New battle",
    "Paths",
    "All paths",
    "Armies",
    "All armies",
  ])
    expect(text()).toContain(title);
  expect(text()).not.toContain("Block: Shield wall");
  expect(text()).not.toContain("Terrain");
});

test("formation blocks are in the Assets tab", () => {
  openBattle();
  show(
    <AssetsPanel
      onAddAsset={() => {}}
      selectedMapFilename={null}
      onSelectMap={() => {}}
      onDeleteAsset={() => {}}
      onAssetRenamed={() => {}}
    />
  );
  expect(text()).toContain("Block: Shield wall");
  act(() => useMapStore.setState({ selectedUnitIds: new Set() }));
  expect(text()).toContain("Formation blocks");
});

test("the Drawing tab has the open battle's terrain, and says to open a battle on the main map", () => {
  openBattle();
  show(<DrawingPanel />);
  expect(text()).toContain("Terrain: Hastings");
  act(() => useMapStore.setState({ activeSceneId: "map" }));
  expect(text()).toContain("Open a battle");
});

test("the Animations tab has the selected units' timing and lists every animation", () => {
  openBattle();
  show(<AnimationsPanel />);
  for (const title of [
    "Selected: 1 unit",
    "Turning along paths",
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
