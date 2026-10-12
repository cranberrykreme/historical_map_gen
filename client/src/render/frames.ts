import { Shot } from "../types";
import { playedTransition } from "../utils/camera";
import { shotStarts, videoLength } from "../utils/shots";

// The frame rates the render dialog offers; 24 is the default
export const FRAME_RATES = [24, 25, 30];
export const DEFAULT_FPS = 24;

// How the video is encoded. High is for the finished video: ffmpeg works hard and keeps nearly
// everything. Draft is for a quick look: faster, and a much smaller file.
export type RenderQuality = "high" | "draft";
export const QUALITIES: Record<
  RenderQuality,
  { crf: number; preset: string; label: string; hint: string }
> = {
  high: {
    crf: 16,
    preset: "slow",
    label: "High",
    hint: "For the finished video: as sharp as the frames themselves",
  },
  draft: {
    crf: 23,
    preset: "veryfast",
    label: "Draft",
    hint: "For a quick check: renders a little faster and the file is much smaller",
  },
};
export const DEFAULT_CRF = QUALITIES.high.crf;
export const DEFAULT_PRESET = QUALITIES.high.preset;

// A stretch of the video, in seconds
export interface VideoRange {
  from: number;
  to: number;
}

// The whole video
export const wholeVideo = (shots: Shot[]): VideoRange => ({
  from: 0,
  to: videoLength(shots),
});

// One shot, with the halves of any dissolves, wipes or fades that run into it from the shot
// before and out of it into the shot after, so it plays as it does in the whole video. Null if
// there's no such shot.
export function shotRange(shots: Shot[], index: number): VideoRange | null {
  const shot = shots[index];
  if (!shot) return null;
  const start = shotStarts(shots)[index];
  const end = start + shot.seconds;
  const into = index > 0 ? playedTransition(shots, index) : null;
  const outOf =
    index < shots.length - 1 ? playedTransition(shots, index + 1) : null;
  return {
    from: into ? start - into.seconds / 2 : start,
    to: outOf ? end + outOf.seconds / 2 : end,
  };
}

// How many frames a video of `seconds` has at `fps`: at least one, so even the shortest video
// makes a file
export const frameCount = (seconds: number, fps: number): number =>
  Math.max(1, Math.round(seconds * fps));

// The moment of the video each frame shows: frame 0 at the start (of the video, or of the
// stretch being rendered), then every 1/fps seconds
export const frameTime = (index: number, fps: number, from = 0): number =>
  from + index / fps;

// How far a render has got
export interface RenderProgress {
  done: number; // frames sent so far
  total: number;
  elapsed: number; // seconds since the render started
}

// Roughly how long the rest of a render will take, from how long it has taken so far; null
// until there's enough to go on
export function secondsLeft(
  done: number,
  total: number,
  elapsed: number
): number | null {
  if (done < 5 || elapsed <= 0) return null;
  return Math.max(0, (elapsed / done) * (total - done));
}

// "2 min 05 s", "45 s"
export function formatDuration(seconds: number): string {
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return minutes > 0
    ? `${minutes} min ${String(rest).padStart(2, "0")} s`
    : `${rest} s`;
}

// "34.2 MB"
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// A file name the server will accept, as it will clean it: letters, digits, - and _ only
export function cleanName(name: string): string {
  const cleaned = name
    .replace(/\.[^.]*$/, "")
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  return cleaned || "video";
}
