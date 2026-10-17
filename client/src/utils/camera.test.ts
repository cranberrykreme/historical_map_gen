import { CameraView, Shot } from "../types";
import {
  ArmyTracker,
  armySeenInShot,
  cameraAt,
  easeCamera,
  fadeDarkness,
  fadeOutSpan,
  FOLLOW_BLEND_SECONDS,
  followTarget,
  FRAME_RIGHT_CLEARANCE,
  frameRect,
  frameRoom,
  lerpView,
  placementFor,
  playedTransition,
  secondsInShot,
  shotCameras,
  transitionAt,
  transitionSpans,
  videoDarkness,
  viewOnScreen,
} from "./camera";

const view = (
  centerX: number,
  centerY: number,
  height: number
): CameraView => ({
  centerX,
  centerY,
  height,
});

const shot = (
  id: string,
  seconds: number,
  extra: Partial<Shot> = {}
): Shot => ({
  id,
  name: id,
  seconds,
  from: 1000,
  to: 1001,
  ...extra,
});

const WIDE = view(500, 500, 1000);
const CLOSE = view(800, 300, 250);
const OPENING = view(0, 0, 2000);

test("the frame's room is above the timeline and clear of the tab rail", () => {
  expect(frameRoom(1200, 800, 500)).toEqual({
    left: 0,
    top: 0,
    width: 1200 - FRAME_RIGHT_CLEARANCE,
    height: 500,
  });
  // No timeline, or one reaching past the area, still leaves a sensible room
  expect(frameRoom(1200, 800, null).height).toBe(800);
  expect(frameRoom(1200, 800, 2000).height).toBe(800);
  expect(frameRoom(1200, 800, -5).height).toBe(1);
});

test("the frame is the biggest of its shape that fits with a margin, centred", () => {
  const room = (width: number, height: number) => ({
    left: 0,
    top: 0,
    width,
    height,
  });
  // A wide room: the frame is as tall as the room allows
  expect(frameRect(room(1600, 600), "landscape", 0)).toEqual({
    left: (1600 - 600 * (16 / 9)) / 2,
    top: 0,
    width: 600 * (16 / 9),
    height: 600,
  });
  // A tall one: as wide as the room allows
  const tall = frameRect(room(800, 1200), "landscape", 0);
  expect(tall.width).toBeCloseTo(800, 9);
  expect(tall.height).toBeCloseTo(450, 9);
  expect(tall.top).toBeCloseTo(375, 9);
  // Portrait in a wide room, with the margin
  const portrait = frameRect(room(1600, 900), "portrait", 50);
  expect(portrait.height).toBeCloseTo(800, 9);
  expect(portrait.width).toBeCloseTo(450, 9);
  expect(portrait.left + portrait.width / 2).toBeCloseTo(800, 9);
});

test("a view is read from the map's place on screen, and placed back the same", () => {
  const frame = { left: 100, top: 50, width: 800, height: 450 };
  // The map moved 20 px right and 10 px down, at twice its size
  const placement = { x: 20, y: 10, scale: 2 };
  const view = viewOnScreen(placement, frame);
  expect(view).toEqual({
    centerX: (500 - 20) / 2,
    centerY: (275 - 10) / 2,
    height: 225,
  });
  const back = placementFor(view, frame);
  expect(back.x).toBeCloseTo(20, 9);
  expect(back.y).toBeCloseTo(10, 9);
  expect(back.scale).toBeCloseTo(2, 9);
  // The same view in a frame half as tall shows the map at half the size
  expect(placementFor(view, { ...frame, height: 225 }).scale).toBeCloseTo(1, 9);
});

test("camera moves start and stop gently", () => {
  expect(easeCamera(0)).toBe(0);
  expect(easeCamera(0.5)).toBeCloseTo(0.5, 9);
  expect(easeCamera(1)).toBe(1);
  expect(easeCamera(0.05)).toBeLessThan(0.05);
  expect(easeCamera(0.95)).toBeGreaterThan(0.95);
  expect(easeCamera(-1)).toBe(0);
  expect(easeCamera(2)).toBe(1);
});

test("the zoom changes by the same factor in equal times", () => {
  const a = view(0, 0, 1600);
  const b = view(0, 0, 100); // 16x closer
  expect(lerpView(a, b, 0.5).height).toBeCloseTo(400, 6); // 4x halfway
  expect(lerpView(a, b, 0.25).height).toBeCloseTo(800, 6); // 2x a quarter of the way
  expect(lerpView(a, b, 0)).toEqual(a);
  expect(lerpView(a, b, 1).height).toBeCloseTo(100, 9);
});

test("the pan keeps pace with the zoom, and is plain when the zoom holds", () => {
  const flat = lerpView(view(0, 0, 100), view(100, 50, 100), 0.5);
  expect(flat).toEqual(view(50, 25, 100));

  // Zooming in, the map slides across the screen evenly: each step moves the same share of
  // the frame, so in map units the pan slows as the view tightens
  const a = view(0, 0, 1000);
  const b = view(1000, 0, 100);
  const quarter = lerpView(a, b, 0.25).centerX;
  const half = lerpView(a, b, 0.5).centerX;
  expect(quarter).toBeGreaterThan(250);
  expect(half - quarter).toBeLessThan(quarter);
  expect(lerpView(a, b, 1).centerX).toBeCloseTo(1000, 6);
});

test("a shot with no views holds where the camera was", () => {
  const shots = [
    shot("a", 10, { startView: WIDE, endView: CLOSE }),
    shot("b", 5),
  ];
  const cameras = shotCameras(shots, OPENING);
  expect(cameras[1]).toMatchObject({ start: CLOSE, end: CLOSE });
  expect(cameraAt(shots, 12, OPENING)).toEqual(CLOSE);
});

test("the first shot with no views shows the project's saved view, or nothing", () => {
  expect(cameraAt([shot("a", 10)], 5, OPENING)).toEqual(OPENING);
  expect(cameraAt([shot("a", 10)], 5, null)).toBeNull();
  expect(cameraAt([], 5, OPENING)).toBeNull();
});

test("a shot with only a start view holds it; with only an end view it moves there", () => {
  const holds = [shot("a", 10, { startView: WIDE })];
  expect(cameraAt(holds, 7, OPENING)).toEqual(WIDE);

  const moves = [shot("a", 10, { endView: CLOSE })];
  expect(cameraAt(moves, 0, OPENING)).toEqual(OPENING);
  expect(cameraAt(moves, 10, OPENING)?.height).toBeCloseTo(250, 6);
});

test("a camera move eases from the start view to the end view", () => {
  const shots = [shot("a", 10, { startView: WIDE, endView: CLOSE })];
  expect(cameraAt(shots, 0, null)).toEqual(WIDE);
  const early = cameraAt(shots, 1, null)!;
  const steadyEarly = lerpView(WIDE, CLOSE, 0.1);
  expect(early.height).toBeGreaterThan(steadyEarly.height); // still near the start
  expect(cameraAt(shots, 10, null)!.centerX).toBeCloseTo(800, 6);
});

test("each shot cuts to its own start view; following on ignores it", () => {
  const shots = [
    shot("a", 10, { startView: WIDE, endView: CLOSE }),
    shot("b", 10, { startView: OPENING }),
    shot("c", 10, { startView: WIDE, endView: CLOSE, followOn: true }),
  ];
  // b cuts to its own view
  expect(cameraAt(shots, 10, null)).toEqual(OPENING);
  // c starts where b ends, not at its own (kept) start view
  expect(cameraAt(shots, 20, null)).toEqual(OPENING);
  expect(cameraAt(shots, 30, null)!.height).toBeCloseTo(250, 6);
});

test("a transition sits across the cut, never longer than either shot", () => {
  const shots = [
    shot("a", 10),
    shot("b", 4, { transition: { kind: "dissolve", seconds: 2 } }),
    shot("c", 1, { transition: { kind: "fade", seconds: 3 } }),
  ];
  expect(playedTransition(shots, 0)).toBeNull();
  expect(playedTransition(shots, 1)?.seconds).toBe(2);
  expect(playedTransition(shots, 2)?.seconds).toBe(1); // c is only 1 s long

  // The dissolve runs from 9 s to 11 s
  expect(transitionAt(shots, 8.9)).toBeNull();
  expect(transitionAt(shots, 9)).toMatchObject({
    kind: "dissolve",
    progress: 0,
    outgoing: 0,
    incoming: 1,
  });
  expect(transitionAt(shots, 10)?.progress).toBeCloseTo(0.5, 9);
  expect(transitionAt(shots, 11)).toBeNull();
});

test("a fade dips to black at the cut; into the first shot it comes in from black", () => {
  const between = [
    shot("a", 10),
    shot("b", 10, { transition: { kind: "fade", seconds: 2 } }),
  ];
  expect(fadeDarkness(transitionAt(between, 9)!)).toBeCloseTo(0, 9);
  expect(fadeDarkness(transitionAt(between, 10)!)).toBeCloseTo(1, 9);
  expect(fadeDarkness(transitionAt(between, 10.999)!)).toBeLessThan(0.01);

  const opening = [shot("a", 10, { transition: { kind: "fade", seconds: 2 } })];
  const start = transitionAt(opening, 0)!;
  expect(start.outgoing).toBeNull();
  expect(fadeDarkness(start)).toBe(1);
  expect(fadeDarkness(transitionAt(opening, 1)!)).toBeCloseTo(0.5, 9);
  expect(transitionAt(opening, 2)).toBeNull();
});

test("wipes go left unless told otherwise", () => {
  const shots = [
    shot("a", 10),
    shot("b", 10, { transition: { kind: "wipe", seconds: 1 } }),
    shot("c", 10, {
      transition: { kind: "wipe", seconds: 1, direction: "up" },
    }),
  ];
  expect(transitionAt(shots, 10)?.direction).toBe("left");
  expect(transitionAt(shots, 20)?.direction).toBe("up");
});

test("a shot being left holds its last frame, and one coming in its first", () => {
  const shots = [shot("a", 10), shot("b", 10)];
  expect(secondsInShot(shots, 0, 10.5)).toBeLessThan(10);
  expect(secondsInShot(shots, 0, 10.5)).toBeGreaterThan(9.99);
  expect(secondsInShot(shots, 1, 9.5)).toBe(10);
  expect(secondsInShot(shots, 1, 12)).toBe(12);
});

test("the first shot never follows on: it has nothing before it", () => {
  const shots = [shot("a", 10, { startView: WIDE, followOn: true })];
  expect(cameraAt(shots, 5, OPENING)).toEqual(WIDE);
});

test("the last shot can fade the video out to black at the very end", () => {
  const shots = [shot("a", 10), shot("b", 6, { fadeOut: 2 })];
  expect(fadeOutSpan(shots)).toEqual({ from: 14, to: 16 });
  expect(videoDarkness(shots, 13.9)).toBe(0);
  expect(videoDarkness(shots, 15)).toBeCloseTo(0.5, 9);
  expect(videoDarkness(shots, 16)).toBe(1);
  // Never longer than the shot, and ignored on a shot that isn't last
  expect(fadeOutSpan([shot("a", 1, { fadeOut: 5 })])).toEqual({
    from: 0,
    to: 1,
  });
  expect(fadeOutSpan([shot("a", 10, { fadeOut: 2 }), shot("b", 5)])).toBeNull();
});

test("the video darkens only for fades, never for dissolves or wipes", () => {
  const shots = [
    shot("a", 10, { transition: { kind: "fade", seconds: 2 } }),
    shot("b", 10, { transition: { kind: "dissolve", seconds: 2 } }),
    shot("c", 10, { transition: { kind: "fade", seconds: 2 } }),
  ];
  expect(videoDarkness(shots, 0)).toBe(1); // in from black
  expect(videoDarkness(shots, 5)).toBe(0);
  expect(videoDarkness(shots, 10)).toBe(0); // the dissolve
  expect(videoDarkness(shots, 20)).toBeCloseTo(1, 9); // black at the cut
});

test("every transition, and the fade out, has its place on the video", () => {
  const shots = [
    shot("a", 10, { transition: { kind: "fade", seconds: 1 } }),
    shot("b", 10, { transition: { kind: "wipe", seconds: 2 } }),
    shot("c", 10, { fadeOut: 3 }),
  ];
  expect(transitionSpans(shots)).toEqual([
    { kind: "fade", from: 0, to: 1 },
    { kind: "wipe", from: 9, to: 11 },
    { kind: "fadeOut", from: 27, to: 30 },
  ]);
});

// An army marching steadily right along y = 50, one map unit per day, from day 1000. Before
// day 990 it isn't on the map.
const marching: ArmyTracker = (armyId, time) =>
  armyId === "army" && time >= 990 ? { x: time - 1000, y: 50 } : null;

test("a following camera points at the army, smoothed over a second of video", () => {
  // 10 s of video covering 100 days: the army moves 10 map units a second
  const s = shot("a", 10, { from: 1000, to: 1100, follow: "army" });
  expect(followTarget(s, 5, marching)).toEqual({ x: 50, y: 50 });
  // At the very start the window only looks ahead, so the camera leans a little ahead
  expect(followTarget(s, 0, marching)!.x).toBeCloseTo(2.5, 9);
  expect(followTarget(s, 5, undefined)).toBeNull();
  expect(followTarget({ ...s, follow: undefined }, 5, marching)).toBeNull();
});

test("following keeps the zoom from the shot's views", () => {
  const shots = [
    shot("a", 10, {
      from: 1000,
      to: 1100,
      follow: "army",
      startView: view(0, 0, 400),
      endView: view(999, 999, 100),
    }),
  ];
  const mid = cameraAt(shots, 5, null, marching)!;
  expect(mid.centerX).toBeCloseTo(50, 9);
  expect(mid.centerY).toBeCloseTo(50, 9);
  expect(mid.height).toBeCloseTo(200, 6); // halfway between 4x and 1x in zoom
});

test("with nobody to follow the camera uses the shot's views", () => {
  const shots = [
    shot("a", 10, { from: 900, to: 950, follow: "army", startView: WIDE }),
  ];
  expect(cameraAt(shots, 5, null, marching)).toEqual(WIDE);
  // An army that doesn't exist, or no tracker at all, does the same
  expect(cameraAt(shots, 5, null, undefined)).toEqual(WIDE);
});

test("following on eases from where the camera was onto the army", () => {
  const shots = [
    shot("a", 10, { startView: view(-500, 50, 300) }),
    shot("b", 10, {
      from: 1000,
      to: 1100,
      follow: "army",
      followOn: true,
    }),
  ];
  // At the cut the camera is still where shot a left it
  expect(cameraAt(shots, 10, null, marching)!.centerX).toBeCloseTo(-500, 6);
  // Part way through the blend it is between the two
  const partway = cameraAt(
    shots,
    10 + FOLLOW_BLEND_SECONDS / 2,
    null,
    marching
  )!;
  expect(partway.centerX).toBeGreaterThan(-500);
  expect(partway.centerX).toBeLessThan(5);
  // After it, on the army
  expect(cameraAt(shots, 15, null, marching)!.centerX).toBeCloseTo(50, 9);
});

test("a shot after a following one carries on from where the army took the camera", () => {
  const shots = [
    shot("a", 10, {
      from: 1000,
      to: 1100,
      follow: "army",
      startView: view(0, 0, 300),
    }),
    shot("b", 5),
  ];
  const held = cameraAt(shots, 12, null, marching)!;
  // The army ends at x = 100; smoothing at the very end looks back half a second
  expect(held.centerX).toBeCloseTo(97.5, 9);
  expect(held.height).toBeCloseTo(300, 9);
});

test("an army counts as in a shot if anyone is on the map at some point during it", () => {
  // The army arrives on day 990
  expect(
    armySeenInShot(shot("a", 10, { from: 980, to: 1000 }), "army", marching)
  ).toBe(true);
  expect(
    armySeenInShot(shot("b", 10, { from: 900, to: 950 }), "army", marching)
  ).toBe(false);
  expect(
    armySeenInShot(shot("c", 10, { from: 1000, to: 1100 }), "other", marching)
  ).toBe(false);
});

describe("shots of battles", () => {
  const BATTLE_OPENING = view(800, 450, 950);
  const battles = {
    opening: (id: string) => (id === "b" ? BATTLE_OPENING : null),
    tracker: () => undefined,
  };

  test("a battle's first shot opens on the battlefield, not where the map shot ended", () => {
    const shots = [
      shot("a", 10, { endView: CLOSE }),
      shot("b", 10, { scene: "b" }),
    ];
    expect(cameraAt(shots, 15, OPENING, undefined, battles)).toEqual(
      BATTLE_OPENING
    );
  });

  test("each scene carries its camera on from its own last shot", () => {
    const shots = [
      shot("a", 10, { endView: CLOSE }),
      shot("b", 10, { scene: "b", endView: WIDE }),
      shot("c", 10), // back on the main map: holds where the map was
      shot("d", 10, { scene: "b" }), // back at the battle: holds where it was
    ];
    const cameras = shotCameras(shots, OPENING, undefined, battles);
    expect(cameras[2]).toMatchObject({ start: CLOSE, end: CLOSE });
    expect(cameras[3]).toMatchObject({ start: WIDE, end: WIDE });
  });

  test("following on only carries across a cut within the same scene", () => {
    const shots = [
      shot("a", 10, { startView: WIDE, endView: CLOSE }),
      shot("b", 10, { scene: "b", followOn: true }),
    ];
    const cameras = shotCameras(shots, OPENING, undefined, battles);
    expect(cameras[1]?.start).toEqual(BATTLE_OPENING);
  });

  test("a shot of a battle that's gone films the main map", () => {
    const shots = [
      shot("a", 10, { endView: CLOSE }),
      shot("x", 10, { scene: "gone" }),
    ];
    expect(cameraAt(shots, 15, OPENING, undefined, battles)).toEqual(CLOSE);
    expect(cameraAt([shot("b", 10, { scene: "b" })], 5, OPENING)).toEqual(
      OPENING
    );
  });
});
