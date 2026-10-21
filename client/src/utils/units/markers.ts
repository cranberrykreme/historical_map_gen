// Leaving: the markers left where units fell

import { MarkerKind, PathPoint, Unit, UnitExit } from "../../types";
import { HistoryTime } from "../history/historyTime";
import { Timeline } from "../history/timeline";
import { unitAt } from "./blocks";
import { MARKER_FADE_SECONDS, clamp, exitSeconds } from "./exitStyles";
import { UNIT_IMAGE_WIDTH, leavingPlace } from "./leaving";

type P = PathPoint;

// A marker on the map where a unit went: a cross (upright on screen) or a patch of ground the
// unit's size (turned with it). Width and depth are the unit's, in map units.
export interface DrawMarker {
  id: string;
  kind: MarkerKind;
  x: number;
  y: number;
  rotation: number;
  width: number;
  depth: number;
  alpha: number;
}

// How strongly a marker shows, by how long ago its unit left: it comes in over the second half
// of the animation, then stays, or fades once its time is up
export function markerAlpha(exit: UnitExit, age: number): number {
  const seconds = exitSeconds(exit);
  const coming = clamp((age - seconds / 2) / (seconds / 2), 0, 1);
  if (exit.markerFades === undefined) return coming;
  const going = clamp(
    (age - seconds - exit.markerFades) / MARKER_FADE_SECONDS,
    0,
    1
  );
  return coming * (1 - going);
}

// The markers on the map at a moment
export function markersAt(
  units: Unit[],
  timeline: Timeline,
  moment: HistoryTime,
  ageOf: (unit: Unit) => number | null
): DrawMarker[] {
  const out: DrawMarker[] = [];
  for (const unit of units) {
    const exit = unit.exit;
    if (!exit?.marker || unit.leaves === undefined || moment < unit.leaves)
      continue;
    if ((unit.appears ?? -Infinity) > unit.leaves) continue;
    const alpha = markerAlpha(exit, ageOf(unit) ?? Infinity);
    if (alpha <= 0) continue;
    const place = unitAt(
      { ...unit, ...leavingPlace(timeline, unit) },
      unit.leaves
    );
    const block = place.block;
    out.push({
      id: unit.id,
      kind: exit.marker,
      x: place.x,
      y: place.y,
      rotation: place.rotation,
      width: (block ? block.width : UNIT_IMAGE_WIDTH) * unit.scale,
      depth: (block ? block.depth : UNIT_IMAGE_WIDTH * 0.8) * unit.scale,
      alpha,
    });
  }
  return out;
}

// A seeded random number source, so a unit always breaks and tears the same way
export function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++)
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A patch marker's ragged edge: points round an ellipse `rx` by `ry`, each pushed in or out a
// little, the same every time for the same unit
export function patchOutline(id: string, rx: number, ry: number): P[] {
  const random = seeded(`patch:${id}`);
  const count = 14;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = 0.8 + random() * 0.35;
    return { x: Math.cos(angle) * rx * r, y: Math.sin(angle) * ry * r };
  });
}

// A cross marker's size, from its unit's width: never too small to see or too big
export const crossSize = (width: number) => clamp(width * 0.35, 8, 22);
