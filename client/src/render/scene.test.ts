import { MapPath, Shot, Unit } from "../types";
import { formatHistoryTime } from "../utils/historyTime";
import { getTimeline } from "../utils/timeline";
import { easeCamera } from "../utils/camera";
import { battleCameras, battleScenes } from "../utils/battleCameras";
import {
  pictureAt,
  sceneAt,
  sceneIdAt,
  SceneInput,
  sceneMoment,
  unitsAt,
} from "./scene";

const START = 1000;

const unit = (id: string, extra: Partial<Unit> = {}): Unit => ({
  id,
  filename: `${id}.png`,
  path: `folder/${id}.png`,
  assetType: "units",
  x: 10,
  y: 20,
  rotation: 30,
  scale: 1.5,
  ...extra,
});

const shot = (
  id: string,
  seconds: number,
  extra: Partial<Shot> = {}
): Shot => ({
  id,
  name: id,
  seconds,
  from: START,
  to: START + 10,
  ...extra,
});

const input = (overrides: Partial<SceneInput> = {}): SceneInput => {
  const units = overrides.units ?? [unit("a")];
  const paths: MapPath[] = [];
  return {
    shots: [shot("s", 10)],
    units,
    timeline: getTimeline(paths, units),
    storyStart: START,
    displayMode: "days",
    opening: { centerX: 0, centerY: 0, height: 500 },
    ...overrides,
  };
};

test("a unit is drawn where it stands, with its own turn, size and mirroring", () => {
  const units = [unit("a", { flipped: true })];
  expect(unitsAt(units, getTimeline([], units), START, START)).toEqual([
    {
      id: "a",
      assetType: "units",
      path: "folder/a.png",
      x: 10,
      y: 20,
      rotation: 30,
      scale: 1.5,
      flipped: true,
    },
  ]);
});

test("only units that exist at the moment are drawn", () => {
  const units = [
    unit("early", { leaves: START + 5 }),
    unit("late", { appears: START + 5 }),
    unit("always"),
  ];
  const timeline = getTimeline([], units);
  const ids = (t: number) =>
    unitsAt(units, timeline, t, START).map((u) => u.id);
  expect(ids(START + 1)).toEqual(["early", "always"]);
  expect(ids(START + 6)).toEqual(["late", "always"]);
});

test("a unit with no path to its image file falls back to its file name", () => {
  const units = [unit("a", { path: undefined as unknown as string })];
  expect(unitsAt(units, getTimeline([], units), START, START)[0].path).toBe(
    "a.png"
  );
});

test("the scene follows the shot: its moment, camera, date and fades", () => {
  const scene = sceneAt(
    input({
      shots: [
        shot("s", 10, {
          startView: { centerX: 1, centerY: 2, height: 300 },
          transition: { kind: "fade", seconds: 2 },
        }),
      ],
    }),
    0
  );
  expect(scene.view).toEqual({ centerX: 1, centerY: 2, height: 300 });
  expect(scene.darkness).toBe(1); // fading in from black
  expect(scene.date).toBe(formatHistoryTime(START, "days"));
  expect(scene.units.map((u) => u.id)).toEqual(["a"]);
});

test("a shot can hide the date in the video", () => {
  const scene = sceneAt(
    input({ shots: [shot("s", 10, { hideDate: true })] }),
    5
  );
  expect(scene.date).toBeNull();
});

test("before any shot takes it later, the video shows the story's start", () => {
  expect(sceneMoment(input({ shots: [] }), 3)).toBe(START);
  expect(
    sceneMoment(
      input({ shots: [shot("s", 10, { from: START, to: START + 10 })] }),
      5
    )
  ).toBeCloseTo(START + 5, 9);
});

describe("dissolves and wipes show both shots", () => {
  const A = { centerX: 0, centerY: 0, height: 100 };
  const B = { centerX: 500, centerY: 500, height: 50 };
  const twoShots = (kind: "dissolve" | "wipe" | "fade" | "cut") =>
    input({
      shots: [
        shot("one", 10, { startView: A, from: START, to: START + 10 }),
        shot("two", 10, {
          startView: B,
          from: START + 20,
          to: START + 30,
          transition:
            kind === "cut" ? undefined : { kind, seconds: 2, direction: "up" },
        }),
      ],
    });

  test("before the cut, the new shot waits on its first frame over the old one still playing", () => {
    const picture = pictureAt(twoShots("dissolve"), 9.5);
    expect(picture.blend).not.toBeNull();
    expect(picture.blend!.kind).toBe("dissolve");
    expect(picture.blend!.progress).toBeCloseTo(easeCamera(0.25), 9);
    expect(picture.scene.view).toEqual(B);
    expect(picture.scene.date).toBe(formatHistoryTime(START + 20, "days"));
    expect(picture.blend!.outgoing.view).toEqual(A);
    expect(picture.blend!.outgoing.date).toBe(
      formatHistoryTime(START + 9.5, "days")
    );
  });

  test("after the cut, the old shot holds its last frame under the new one playing", () => {
    const picture = pictureAt(twoShots("dissolve"), 10.5);
    expect(picture.blend!.progress).toBeCloseTo(easeCamera(0.75), 9);
    expect(sceneMoment(twoShots("dissolve"), 10.5)).toBeCloseTo(
      START + 20.5,
      9
    );
    expect(picture.blend!.outgoing.date).toBe(
      formatHistoryTime(START + 10 - 1e-6, "days")
    );
    expect(picture.scene.date).toBe(formatHistoryTime(START + 20.5, "days"));
  });

  test("a wipe carries its direction", () => {
    const picture = pictureAt(twoShots("wipe"), 10);
    expect(picture.blend!.kind).toBe("wipe");
    expect(picture.blend!.direction).toBe("up");
  });

  test("outside a transition, and for cuts and fades, there is one scene", () => {
    expect(pictureAt(twoShots("dissolve"), 5).blend).toBeNull();
    expect(pictureAt(twoShots("dissolve"), 15).blend).toBeNull();
    expect(pictureAt(twoShots("cut"), 10).blend).toBeNull();
    const fade = pictureAt(twoShots("fade"), 9.5);
    expect(fade.blend).toBeNull();
    expect(fade.scene.darkness).toBeGreaterThan(0);
  });

  test("a fade out at the end darkens both shots of a blend alike", () => {
    const base = twoShots("dissolve");
    const shots = [
      { ...base.shots[0], seconds: 2 },
      { ...base.shots[1], seconds: 2, fadeOut: 2 },
    ];
    const picture = pictureAt({ ...base, shots }, 2.5);
    expect(picture.blend).not.toBeNull();
    expect(picture.scene.darkness).toBeGreaterThan(0);
    expect(picture.blend!.outgoing.darkness).toBe(picture.scene.darkness);
  });
});

describe("shots of battles", () => {
  const battles = battleScenes(
    [{ id: "b", name: "Hastings", kind: "land", width: 1600, height: 900 }],
    { b: { units: [unit("soldier")], paths: [], armies: [] } },
    START
  );
  const withBattle = (shots: Shot[]) =>
    input({
      shots,
      battles,
      battleCameras: battleCameras(battles, "landscape"),
    });

  test("a battle shot shows the battle's ground, units and opening view", () => {
    const at = withBattle([shot("m", 10), shot("s", 10, { scene: "b" })]);
    const map = sceneAt(at, 5);
    expect(map.sceneId).toBeUndefined();
    expect(map.units.map((u) => u.id)).toEqual(["a"]);

    const battle = sceneAt(at, 15);
    expect(battle.sceneId).toBe("b");
    expect(battle.units.map((u) => u.id)).toEqual(["soldier"]);
    expect(battle.view?.centerX).toBe(800);
  });

  test("a shot of a deleted battle falls back to the main map", () => {
    const at = withBattle([shot("s", 10, { scene: "gone" })]);
    expect(sceneIdAt(at, 5)).toBe("map");
    expect(sceneAt(at, 5).units.map((u) => u.id)).toEqual(["a"]);
  });
});
