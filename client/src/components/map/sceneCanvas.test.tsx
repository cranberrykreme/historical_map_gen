import React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import SceneCanvas from "./SceneCanvas";
import { applyMapTransform } from "../../utils/video/mapTransform";
import { DrawUnit } from "../../render/scene";

// React needs this to know act() is in charge of updates in tests
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// A drawing surface that writes down where things were drawn: jsdom has no canvas
let calls: { op: string; args: unknown[] }[] = [];
const fakeContext = new Proxy(
  {},
  {
    get: (_target, op: string) =>
      op === "measureText"
        ? () => ({ width: 10 })
        : (...args: unknown[]) => calls.push({ op, args }),
    set: () => true,
  }
);
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  // set up before each test, as the test setup clears mocks between tests
  jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockImplementation(() => fakeContext as never);
  calls = [];
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

const block: DrawUnit = {
  id: "b",
  assetType: "units",
  path: "",
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  flipped: false,
  block: { kind: "foot", colour: "red", width: 160, depth: 40, name: "Fyrd" },
};

function Harness({ units }: { units: DrawUnit[] }) {
  const area = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<HTMLDivElement>(null);
  return (
    <div ref={area} id="area">
      <div ref={map} id="map">
        <SceneCanvas
          mapRef={map}
          containerRef={area}
          markers={[]}
          units={units}
          images={new Map()}
        />
      </div>
    </div>
  );
}

// This is React's own root, not Testing Library's render, so it does need act()
const show = (element: React.ReactElement) =>
  // eslint-disable-next-line testing-library/no-unnecessary-act
  act(() => root.render(element));

const transforms = () =>
  calls.filter((c) => c.op === "setTransform").map((c) => c.args);

test("draws the units at the map's pan and zoom, and again each time the map moves", () => {
  show(<Harness units={[block]} />);
  expect(calls.some((c) => c.op === "fillText" && c.args[0] === "Fyrd")).toBe(
    true
  );
  expect(transforms()).toContainEqual([1, 0, 0, 1, 0, 0]);

  calls = [];
  const map = container.querySelector("#map") as HTMLDivElement;
  applyMapTransform(map, 30, 40, 2);
  // drawn again at once, at the new place and zoom
  expect(transforms()).toContainEqual([2, 0, 0, 2, 30, 40]);
  expect(calls.some((c) => c.op === "fillText" && c.args[0] === "Fyrd")).toBe(
    true
  );
  // and the canvas undoes the map's move on itself, so it stays over the map area
  const canvas = container.querySelector("canvas")!;
  expect(canvas.style.transform).toBe("scale(0.5) translate(-30px, -40px)");
});

test("stops redrawing once it's gone", () => {
  show(<Harness units={[block]} />);
  const map = container.querySelector("#map") as HTMLDivElement;
  show(<div />);
  calls = [];
  applyMapTransform(map, 1, 2, 3);
  expect(calls).toHaveLength(0);
});
