import { Shot } from "../../types";
import { playedTransition } from "./camera";
import { shotStarts } from "./shots";

// Small pictures of each shot's first frame, for the shots lane in Video mode

// The moment of the video a shot's picture is taken from: just after any transition into it
// has finished, so it shows the shot itself rather than black or the shot before
export function thumbnailMoment(shots: Shot[], index: number): number {
  const start = shotStarts(shots)[index] ?? 0;
  const shot = shots[index];
  if (!shot) return start;
  const transition = playedTransition(shots, index);
  const settle = transition
    ? index === 0
      ? transition.seconds
      : transition.seconds / 2
    : 0;
  return start + Math.min(settle + 0.05, shot.seconds * 0.9);
}

// What a shot's picture depends on: the shot itself, the shot before it when the camera
// carries on from there, and the version of the scene it films. The picture is remade only
// when this changes.
export function thumbnailKey(
  shots: Shot[],
  index: number,
  sceneVersion: string
): string {
  const shot = shots[index];
  const before = shots[index - 1];
  const carriesOn = shot.followOn || !shot.startView;
  return JSON.stringify([
    shot,
    carriesOn && before ? before : null,
    sceneVersion,
  ]);
}
