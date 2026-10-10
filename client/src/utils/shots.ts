import { Shot } from "../types";
import { HistoryTime } from "./historyTime";
import { easeTravel } from "./pathPlayback";

// The shortest a shot can be, in seconds of video
export const MIN_SHOT_SECONDS = 0.5;

// How long a new shot is, in seconds of video
export const DEFAULT_SHOT_SECONDS = 10;

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const newShotId = () =>
  `shot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Shots are named Shot 1, Shot 2... after the highest number used
export function nextShotName(shots: Shot[]): string {
  const used = shots
    .map((shot) => /^Shot (\d+)$/.exec(shot.name))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number(match[1]));
  return `Shot ${used.length > 0 ? Math.max(...used) + 1 : 1}`;
}

// A shot that can be played: at least the shortest length, and history that runs forwards
// (or holds still). A shot whose history runs backwards is turned round.
export function clampShot(shot: Shot): Shot {
  const seconds = isNumber(shot.seconds)
    ? Math.max(shot.seconds, MIN_SHOT_SECONDS)
    : DEFAULT_SHOT_SECONDS;
  const from = isNumber(shot.from) ? shot.from : 0;
  const to = isNumber(shot.to) ? shot.to : from;
  return {
    ...shot,
    seconds,
    from: Math.min(from, to),
    to: Math.max(from, to),
  };
}

// Whether a shot holds one moment rather than moving through history
export const isHeld = (shot: Shot): boolean => shot.to - shot.from < 1e-9;

// How long the whole video is, in seconds
export const videoLength = (shots: Shot[]): number =>
  shots.reduce((sum, shot) => sum + shot.seconds, 0);

// When each shot starts on the video, in seconds
export function shotStarts(shots: Shot[]): number[] {
  const starts: number[] = [];
  let at = 0;
  for (const shot of shots) {
    starts.push(at);
    at += shot.seconds;
  }
  return starts;
}

export interface ShotPlace {
  index: number;
  shot: Shot;
  start: number; // when the shot starts on the video
  local: number; // seconds into the shot
}

// The shot on screen at a moment of the video. Before the start counts as the first shot's
// start, and past the end as the last shot's end. Null when there are no shots.
export function shotAt(shots: Shot[], seconds: number): ShotPlace | null {
  if (shots.length === 0) return null;
  const starts = shotStarts(shots);
  const t = Math.max(seconds, 0);
  for (let i = 0; i < shots.length; i++) {
    const end = starts[i] + shots[i].seconds;
    // A moment exactly on a cut belongs to the shot that starts there
    if (t < end || i === shots.length - 1) {
      return {
        index: i,
        shot: shots[i],
        start: starts[i],
        local: Math.min(Math.max(t - starts[i], 0), shots[i].seconds),
      };
    }
  }
  return null;
}

// How far through its history a shot is, seconds into it: steady, or easing in and out
// (the same slow build-up and slowdown as a march)
export function shotProgress(shot: Shot, local: number): number {
  const fraction =
    shot.seconds > 0 ? Math.min(Math.max(local / shot.seconds, 0), 1) : 1;
  return shot.ease ? easeTravel(fraction) : fraction;
}

// The moment in history shown at a moment of the video. Null when there are no shots.
export function historyAt(shots: Shot[], seconds: number): HistoryTime | null {
  const place = shotAt(shots, seconds);
  if (!place) return null;
  const { shot, local } = place;
  return shot.from + (shot.to - shot.from) * shotProgress(shot, local);
}

// When a shot starts on the video, or null if it isn't one of these shots
export function shotStart(shots: Shot[], id: string): number | null {
  const index = shots.findIndex((shot) => shot.id === id);
  return index < 0 ? null : shotStarts(shots)[index];
}

// Moves a shot to another place in the running order
export function moveShot(shots: Shot[], id: string, toIndex: number): Shot[] {
  const from = shots.findIndex((shot) => shot.id === id);
  if (from < 0) return shots;
  const to = Math.min(Math.max(toIndex, 0), shots.length - 1);
  if (to === from) return shots;
  const next = [...shots];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

// Reads the shots saved in a project file, dropping anything that isn't a usable shot
export function parseShots(raw: unknown): Shot[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (s: any) =>
        s &&
        typeof s.id === "string" &&
        isNumber(s.seconds) &&
        isNumber(s.from) &&
        isNumber(s.to)
    )
    .map((s: any) => {
      const shot: Shot = {
        id: s.id,
        name: typeof s.name === "string" && s.name.trim() ? s.name : "Shot",
        seconds: s.seconds,
        from: s.from,
        to: s.to,
      };
      if (s.ease === true) shot.ease = true;
      if (s.hideDate === true) shot.hideDate = true;
      return clampShot(shot);
    });
}

// A length or moment of the video as m:ss, with tenths when it isn't a whole second:
// 75 reads "1:15", 10.5 reads "0:10.5"
export function formatSeconds(seconds: number): string {
  const tenths = Math.round(Math.max(seconds, 0) * 10);
  const whole = Math.floor(tenths / 10);
  const minutes = Math.floor(whole / 60);
  const secs = String(whole % 60).padStart(2, "0");
  const fraction = tenths % 10;
  return `${minutes}:${secs}${fraction ? `.${fraction}` : ""}`;
}

// Where a shot being dragged along the strip would land: the number of other shots whose
// middle is left of `seconds` on the video
export function dropIndex(shots: Shot[], id: string, seconds: number): number {
  const starts = shotStarts(shots);
  return shots.filter(
    (shot, i) => shot.id !== id && starts[i] + shot.seconds / 2 < seconds
  ).length;
}

// The playhead's moment for a moment of the video. Null means the story's start, as it does
// for the playhead: when there are no shots, or the shot shows the start or earlier.
export function videoMoment(
  shots: Shot[],
  seconds: number,
  storyStart: HistoryTime
): HistoryTime | null {
  const t = historyAt(shots, seconds);
  return t === null || t <= storyStart ? null : t;
}

// Whether the on-screen date is hidden at a moment of the video
export const dateHiddenAt = (shots: Shot[], seconds: number): boolean =>
  !!shotAt(shots, seconds)?.shot.hideDate;
