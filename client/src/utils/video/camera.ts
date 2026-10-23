import {
  CameraView,
  MAP_SCENE,
  Shot,
  ShotTransition,
  TransitionKind,
  VideoFrame,
  WipeDirection,
} from "../../types";
import { HistoryTime } from "../history/historyTime";
import {
  MIN_TRANSITION_SECONDS,
  sameView,
  shotAt,
  shotProgress,
  shotStarts,
} from "./shots";

// The video's size in pixels for each frame shape
export const FRAME_PIXELS: Record<
  VideoFrame,
  { width: number; height: number }
> = {
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1920 },
};

// Width over height
export const frameAspect = (frame: VideoFrame): number =>
  FRAME_PIXELS[frame].width / FRAME_PIXELS[frame].height;

// Room left around the frame on the map, in screen pixels, so its edge can be seen
export const FRAME_MARGIN = 24;

// Room the frame leaves on the map's right. The map now ends where the side panel starts,
// so the frame's own margin is enough.
export const FRAME_RIGHT_CLEARANCE = 0;

// The closest a camera can zoom in or out, as map units shown from top to bottom of the frame
const MIN_VIEW_HEIGHT = 1e-3;

// A rectangle on screen, in pixels from the map area's top left corner
export interface FrameRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Where the map is on screen: how far it is moved, and how much it is zoomed
export interface MapPlacement {
  x: number;
  y: number;
  scale: number;
}

// The part of the map area the frame can use: everything above the timeline, clear of the
// tab rail. `timelineTop` is how far down the map area the timeline starts (null when there
// is no timeline).
export function frameRoom(
  areaWidth: number,
  areaHeight: number,
  timelineTop: number | null
): FrameRect {
  const bottom =
    timelineTop === null
      ? areaHeight
      : Math.min(Math.max(timelineTop, 0), areaHeight);
  return {
    left: 0,
    top: 0,
    width: Math.max(areaWidth - FRAME_RIGHT_CLEARANCE, 1),
    height: Math.max(bottom, 1),
  };
}

// The biggest frame of the video's shape that fits in the room with a margin all round,
// centred in it
export function frameRect(
  room: FrameRect,
  frame: VideoFrame,
  margin: number = FRAME_MARGIN
): FrameRect {
  const aspect = frameAspect(frame);
  const roomWidth = Math.max(room.width - 2 * margin, 1);
  const roomHeight = Math.max(room.height - 2 * margin, 1);
  const width = Math.min(roomWidth, roomHeight * aspect);
  const height = width / aspect;
  return {
    left: room.left + (room.width - width) / 2,
    top: room.top + (room.height - height) / 2,
    width,
    height,
  };
}

// What the frame shows with the map placed as it is on screen
export function viewOnScreen(
  placement: MapPlacement,
  frame: FrameRect
): CameraView {
  const centreX = frame.left + frame.width / 2;
  const centreY = frame.top + frame.height / 2;
  return {
    centerX: (centreX - placement.x) / placement.scale,
    centerY: (centreY - placement.y) / placement.scale,
    height: Math.max(frame.height / placement.scale, MIN_VIEW_HEIGHT),
  };
}

// Where to place the map on screen so the frame shows a camera view
export function placementFor(view: CameraView, frame: FrameRect): MapPlacement {
  const scale = frame.height / Math.max(view.height, MIN_VIEW_HEIGHT);
  return {
    x: frame.left + frame.width / 2 - view.centerX * scale,
    y: frame.top + frame.height / 2 - view.centerY * scale,
    scale,
  };
}

// Camera moves always start and stop gently: slow, fastest halfway, slow again
export function easeCamera(t: number): number {
  const u = Math.min(Math.max(t, 0), 1);
  return 0.5 - Math.cos(Math.PI * u) / 2;
}

// Part way from one view to another (t from 0 to 1, already eased). The zoom changes by the
// same factor in equal times, so 1x to 4x takes as long as 4x to 16x. The pan keeps pace with
// the zoom, so the map slides across the screen at an even rate rather than rushing at one
// end of the move.
export function lerpView(a: CameraView, b: CameraView, t: number): CameraView {
  const u = Math.min(Math.max(t, 0), 1);
  const ratio = b.height / a.height;
  const height = a.height * Math.pow(ratio, u);
  // How far along the pan is: in step with the zoom, or plain when the zoom stays the same
  const along =
    Math.abs(ratio - 1) < 1e-6 ? u : (Math.pow(ratio, u) - 1) / (ratio - 1);
  return {
    centerX: a.centerX + (b.centerX - a.centerX) * along,
    centerY: a.centerY + (b.centerY - a.centerY) * along,
    height,
  };
}

// Where an army's units are, on average, at a moment in history: the point a following camera
// aims at. Null when the army has no units on the map then.
export type ArmyTracker = (
  armyId: string,
  time: HistoryTime
) => { x: number; y: number } | null;

// A following camera averages the army's position over this much video, centred on the moment
// shown, so it glides through bends and pivots instead of jolting with every turn
export const FOLLOW_SMOOTH_SECONDS = 1;
const FOLLOW_SAMPLES = 9;

// When a following shot follows on, the camera eases from where it was onto the army over
// this long (or half the shot, if that is shorter)
export const FOLLOW_BLEND_SECONDS = 1;

export interface ShotCamera {
  start: CameraView;
  end: CameraView;
  // Where the camera really was as the shot before ended (null for the first shot)
  before: CameraView | null;
}

// The point a following shot aims at, `local` seconds in: the army's position averaged over the
// smoothing window, kept within the shot so other shots' history never leaks in. Null when the
// shot follows nobody, or the army is nowhere to be seen throughout the window.
export function followTarget(
  shot: Shot,
  local: number,
  tracker: ArmyTracker | undefined
): { x: number; y: number } | null {
  if (!shot.follow || !tracker) return null;
  const half = FOLLOW_SMOOTH_SECONDS / 2;
  const from = Math.max(local - half, 0);
  const to = Math.min(local + half, shot.seconds);
  let x = 0;
  let y = 0;
  let found = 0;
  for (let i = 0; i < FOLLOW_SAMPLES; i++) {
    const s = from + ((to - from) * i) / (FOLLOW_SAMPLES - 1);
    const time = shot.from + (shot.to - shot.from) * shotProgress(shot, s);
    const point = tracker(shot.follow, time);
    if (!point) continue;
    x += point.x;
    y += point.y;
    found++;
  }
  return found > 0 ? { x: x / found, y: y / found } : null;
}

// Whether an army has anyone on the map at some point during a shot, for marking armies in
// the Follow list that the camera would have nothing to follow in
const SEEN_SAMPLES = 17;

export function armySeenInShot(
  shot: Shot,
  armyId: string,
  tracker: ArmyTracker
): boolean {
  for (let i = 0; i < SEEN_SAMPLES; i++) {
    const local = (shot.seconds * i) / (SEEN_SAMPLES - 1);
    const time = shot.from + (shot.to - shot.from) * shotProgress(shot, local);
    if (tracker(armyId, time)) return true;
  }
  return false;
}

// The camera part way through a shot, `local` seconds in. Its views set the zoom (and where
// it points); a shot that follows an army points at the army instead, easing onto it from
// where the camera was if it follows on.
export function cameraInShot(
  shot: Shot,
  camera: ShotCamera,
  local: number,
  tracker?: ArmyTracker
): CameraView {
  const t = shot.seconds > 0 ? local / shot.seconds : 1;
  const base = sameView(camera.start, camera.end)
    ? camera.start
    : lerpView(camera.start, camera.end, easeCamera(t));
  const target = followTarget(shot, local, tracker);
  if (!target) return base;

  let centerX = target.x;
  let centerY = target.y;
  const blend = Math.min(FOLLOW_BLEND_SECONDS, shot.seconds / 2);
  if (shot.followOn && camera.before && blend > 0 && local < blend) {
    const u = easeCamera(local / blend);
    centerX = camera.before.centerX + (target.x - camera.before.centerX) * u;
    centerY = camera.before.centerY + (target.y - camera.before.centerY) * u;
  }
  return { centerX, centerY, height: base.height };
}

// The scene a shot shows: a battle's id, or the main map
export const shotScene = (shot: Shot): string => shot.scene ?? MAP_SCENE;

// Where the camera opens in each battle, and where each battle's armies are, for shots that
// show a battle. (The main map's are the `opening` and `tracker` passed alongside.)
export interface BattleCameras {
  opening: (battleId: string) => CameraView | null;
  tracker: (battleId: string) => ArmyTracker | undefined;
}

// The scene the camera films for a shot: its battle, or the main map when the shot shows the
// main map or a battle that no longer exists (as the editor and renderer fall back too)
function filmedScene(shot: Shot, battles?: BattleCameras): string {
  const scene = shotScene(shot);
  return scene !== MAP_SCENE && battles?.opening(scene) ? scene : MAP_SCENE;
}

// Where each shot's camera starts and ends. A shot with no start view (or following on)
// starts where the camera was at the end of the shot before in the same scene; the first in
// each scene starts at that scene's opening view (the project's saved view on the main map,
// the whole battlefield in a battle). Following on only carries on from a shot in the same
// scene; after a cut between scenes it starts afresh. A shot with no end view holds its start.
// A shot that follows an army hands on wherever the army took the camera. Null for shots with
// nothing to go on (no views anywhere before them in their scene and no opening view). A shot
// of a battle that's gone films the main map.
export function shotCameras(
  shots: Shot[],
  opening: CameraView | null,
  tracker?: ArmyTracker,
  battles?: BattleCameras
): (ShotCamera | null)[] {
  const openingOf = (scene: string) =>
    scene === MAP_SCENE ? opening : (battles?.opening(scene) ?? null);
  const trackerOf = (scene: string) =>
    scene === MAP_SCENE ? tracker : battles?.tracker(scene);
  // Where the camera was last left in each scene
  const previous = new Map<string, CameraView | null>();
  return shots.map((shot, i) => {
    const scene = filmedScene(shot, battles);
    const last = previous.has(scene) ? previous.get(scene)! : openingOf(scene);
    // Only a shot straight after one in the same scene can follow on from it
    const carriesOn = i > 0 && filmedScene(shots[i - 1], battles) === scene;
    const follows = !!shot.followOn && carriesOn;
    const before = carriesOn ? last : null;
    const start = (follows ? undefined : shot.startView) ?? last ?? null;
    const end = shot.endView ?? start;
    if (!start || !end) return null;
    const camera: ShotCamera = { start, end, before };
    previous.set(
      scene,
      shot.follow
        ? cameraInShot(shot, camera, shot.seconds, trackerOf(scene))
        : end
    );
    return camera;
  });
}

// What the camera sees at a moment of the video. Null when there are no shots, or nothing
// says where the camera should be.
export function cameraAt(
  shots: Shot[],
  seconds: number,
  opening: CameraView | null,
  tracker?: ArmyTracker,
  battles?: BattleCameras
): CameraView | null {
  const place = shotAt(shots, seconds);
  if (!place) return null;
  const camera = shotCameras(shots, opening, tracker, battles)[place.index];
  const scene = filmedScene(place.shot, battles);
  const sceneTracker = scene === MAP_SCENE ? tracker : battles?.tracker(scene);
  return camera
    ? cameraInShot(place.shot, camera, place.local, sceneTracker)
    : null;
}

// A shot's transition as it plays: never longer than either shot it joins (so it stays within
// them), and never shorter than the minimum. Null for a cut.
export function playedTransition(
  shots: Shot[],
  index: number
): ShotTransition | null {
  const shot = shots[index];
  const transition = shot?.transition;
  if (!transition || transition.kind === "cut") return null;
  const before = index > 0 ? shots[index - 1].seconds : Infinity;
  const longest = Math.min(shot.seconds, before);
  return {
    ...transition,
    seconds: Math.min(
      Math.max(transition.seconds, MIN_TRANSITION_SECONDS),
      longest
    ),
  };
}

export interface TransitionPlace {
  kind: Exclude<TransitionKind, "cut">;
  direction: WipeDirection;
  progress: number; // 0 as it begins to 1 as it ends, already eased
  outgoing: number | null; // the shot being left, or null for black (into the first shot)
  incoming: number; // the shot being shown
}

// The transition on screen at a moment of the video, if any. One between shots runs across
// the cut, half in each; one into the first shot comes in from black at the very start.
export function transitionAt(
  shots: Shot[],
  seconds: number
): TransitionPlace | null {
  const starts = shotStarts(shots);
  for (let i = 0; i < shots.length; i++) {
    const transition = playedTransition(shots, i);
    if (!transition) continue;
    const from = i === 0 ? 0 : starts[i] - transition.seconds / 2;
    const to = from + transition.seconds;
    if (seconds >= from && seconds < to) {
      return {
        kind: transition.kind as Exclude<TransitionKind, "cut">,
        direction: transition.direction ?? "left",
        progress: easeCamera((seconds - from) / transition.seconds),
        outgoing: i === 0 ? null : i - 1,
        incoming: i,
      };
    }
  }
  return null;
}

// A moment of the video kept within one shot: before it, its first moment; after it, just
// before its end. A shot being left during a transition holds its last frame, and one coming
// in holds its first, until the cut reaches them.
export function secondsInShot(
  shots: Shot[],
  index: number,
  seconds: number
): number {
  const start = shotStarts(shots)[index] ?? 0;
  const end = start + (shots[index]?.seconds ?? 0);
  return Math.min(Math.max(seconds, start), Math.max(end - 1e-6, start));
}

// How dark the screen is during a fade through black: none at either end, fully black at the
// cut. Into the first shot it starts black and clears.
export function fadeDarkness(place: TransitionPlace): number {
  return place.outgoing === null
    ? 1 - place.progress
    : 1 - Math.abs(2 * place.progress - 1);
}

// The fade to black at the very end of the video, from the last shot's fade out: never
// longer than that shot. Null when the video just ends.
export function fadeOutSpan(
  shots: Shot[]
): { from: number; to: number } | null {
  const last = shots[shots.length - 1];
  if (!last?.fadeOut) return null;
  const seconds = Math.min(
    Math.max(last.fadeOut, MIN_TRANSITION_SECONDS),
    last.seconds
  );
  const to = shotStarts(shots)[shots.length - 1] + last.seconds;
  return { from: to - seconds, to };
}

// How dark the video is at a moment: fading in from black at the start, dipping to black
// between shots, or fading out at the end. 0 is the picture as it is, 1 is black. Dissolves
// and wipes don't darken.
export function videoDarkness(shots: Shot[], seconds: number): number {
  const place = transitionAt(shots, seconds);
  const dip = place?.kind === "fade" ? fadeDarkness(place) : 0;
  const out = fadeOutSpan(shots);
  const ending =
    out && seconds >= out.from
      ? easeCamera((seconds - out.from) / (out.to - out.from))
      : 0;
  return Math.max(dip, ending);
}

export interface TransitionSpan {
  kind: Exclude<TransitionKind, "cut"> | "fadeOut";
  from: number;
  to: number;
}

// Where every transition sits on the video, including the fade out at the end, for drawing
// them on the video strip
export function transitionSpans(shots: Shot[]): TransitionSpan[] {
  const starts = shotStarts(shots);
  const spans: TransitionSpan[] = [];
  shots.forEach((_, i) => {
    const transition = playedTransition(shots, i);
    if (!transition) return;
    const from = i === 0 ? 0 : starts[i] - transition.seconds / 2;
    spans.push({
      kind: transition.kind as Exclude<TransitionKind, "cut">,
      from,
      to: from + transition.seconds,
    });
  });
  const out = fadeOutSpan(shots);
  if (out) spans.push({ kind: "fadeOut", ...out });
  return spans;
}
