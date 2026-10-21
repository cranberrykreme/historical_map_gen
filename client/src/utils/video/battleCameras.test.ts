import { Battle } from "../../types";
import { battleCameras, battleOpening, battleScenes } from "./battleCameras";

const battle = (id: string, width = 1600, height = 900): Battle => ({
  id,
  name: id,
  kind: "land",
  width,
  height,
});

test("a battle opens on the whole battlefield, with a little room, fitted to the frame", () => {
  const wide = battleOpening({ width: 1600, height: 900 }, "landscape");
  expect(wide.centerX).toBe(800);
  expect(wide.centerY).toBe(450);
  expect(wide.height).toBeCloseTo(900 * 1.05, 6);
  // In a tall frame the width decides how far out the camera is
  const tall = battleOpening({ width: 1600, height: 900 }, "portrait");
  expect(tall.height).toBeGreaterThan(1600);
});

test("every battle is ready for the video, empty ones included", () => {
  const scenes = battleScenes(
    [battle("b1"), battle("b2")],
    {
      b1: {
        units: [
          {
            id: "u",
            filename: "u.png",
            path: "u.png",
            assetType: "units",
            x: 1,
            y: 2,
            rotation: 0,
            scale: 1,
          },
        ],
        paths: [],
        armies: [],
      },
    },
    1000
  );
  expect(Object.keys(scenes)).toEqual(["b1", "b2"]);
  expect(scenes.b1.units.map((u) => u.id)).toEqual(["u"]);
  expect(scenes.b2.units).toEqual([]);

  const cameras = battleCameras(scenes, "landscape");
  expect(cameras.opening("b1")?.centerX).toBe(800);
  expect(cameras.opening("gone")).toBeNull();
  expect(cameras.tracker("b2")).toBeDefined();
  expect(cameras.tracker("gone")).toBeUndefined();
});
