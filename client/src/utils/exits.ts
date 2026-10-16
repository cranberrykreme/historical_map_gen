import {
  ExitStyle,
  MarkerKind,
  PathPoint,
  Shot,
  Unit,
  UnitExit,
} from "../types";
import { HistoryTime, MINUTE } from "./historyTime";
import { historyAt, shotAt, shotProgress, shotStarts } from "./shots";
import { Timeline } from "./timeline";
import { unitFacing, effectiveForward } from "./unitFacing";
import { blockBox, unitAt } from "./blocks";

// How units go when they leave: deaths and other leaving animations, and the markers left
// where they fell. A unit leaves at its `leaves` moment in history; its `exit` says how.
//
// The animation runs in seconds of video, not history, so a death always reads the same on
// screen however fast the shot is moving through time. It starts when the video reaches the
// moment the unit leaves (see videoExitAge). Everything here is shared by the editor and the
// video renderer, so both show a death exactly alike.

type P = PathPoint;

// ---- Styles ----

export const EXIT_STYLES: {
  style: ExitStyle;
  label: string;
  hint: string;
  seconds: number;
}[] = [
  { style: "fade", label: "Fade", hint: "Fades away", seconds: 1 },
  {
    style: "fall",
    label: "Fall",
    hint: "Topples over and fades: a single soldier or a portrait",
    seconds: 1.4,
  },
  {
    style: "shatter",
    label: "Shatter",
    hint: "Breaks into pieces that fly apart: a unit destroyed",
    seconds: 1.4,
  },
  {
    style: "sink",
    label: "Sink",
    hint: "Tilts, shrinks and goes under with ripples: ships",
    seconds: 2,
  },
  {
    style: "rout",
    label: "Rout",
    hint: "Flickers and drifts backwards as it fades: troops breaking and running",
    seconds: 1.6,
  },
  {
    style: "tear",
    label: "Tear",
    hint: "Tears like paper from both top corners into an X, then falls apart",
    seconds: 1.8,
  },
];

export const exitStyleInfo = (style: ExitStyle) =>
  EXIT_STYLES.find((s) => s.style === style) ?? EXIT_STYLES[0];

export const MARKER_KINDS: { kind: MarkerKind; label: string; hint: string }[] =
  [
    { kind: "cross", label: "Cross", hint: "A small cross where it fell" },
    {
      kind: "patch",
      label: "Patch",
      hint: "A dark patch of ground where it fell",
    },
  ];

// How long an animation can take, in seconds of video
export const EXIT_SECONDS = { min: 0.3, max: 6 };
// How long a marker can stay before fading, in seconds of video
export const MARKER_FADES = { min: 1, max: 120 };
// How long a marker takes to fade once its time is up, in seconds of video
export const MARKER_FADE_SECONDS = 1;

const clamp = (n: number, low: number, high: number) =>
  Math.min(high, Math.max(low, n));
const isNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

// A leaving animation with its settings in range (or undefined if it isn't one)
export function tidyExit(
  exit: UnitExit | undefined | null
): UnitExit | undefined {
  if (!exit || !EXIT_STYLES.some((s) => s.style === exit.style))
    return undefined;
  const out: UnitExit = { style: exit.style };
  if (isNumber(exit.seconds))
    out.seconds =
      Math.round(clamp(exit.seconds, EXIT_SECONDS.min, EXIT_SECONDS.max) * 10) /
      10;
  if (exit.marker && MARKER_KINDS.some((m) => m.kind === exit.marker)) {
    out.marker = exit.marker;
    if (isNumber(exit.markerFades))
      out.markerFades = Math.round(
        clamp(exit.markerFades, MARKER_FADES.min, MARKER_FADES.max)
      );
  }
  return out;
}

// How long a unit's leaving animation takes, in seconds of video
export const exitSeconds = (exit: UnitExit) =>
  exit.seconds ?? exitStyleInfo(exit.style).seconds;

// The death a unit gets if it dies without one set: ships sink, blocks shatter, portraits tear,
// anything else fades
export function defaultExit(unit: Unit): UnitExit {
  if (unit.block) return { style: "shatter" };
  if (unit.assetType === "portraits") return { style: "tear" };
  if (unitFacing(unit).travelMode === "upright") return { style: "sink" };
  return { style: "fade" };
}

// ---- When ----

// Two moments closer than this count as the same: a shot that starts where the one before
// ended carries straight on from it
const SAME_MOMENT = MINUTE / 2;

// How many seconds of video ago the video reached history moment `leaves`, at `seconds` into
// the video. Null while the video hasn't got there yet. The search goes back through the shot on
// screen and any shots before it that carry straight on; a cut that jumps past the moment means
// it happened off screen, long ago (Infinity), while a cut landing right on it starts the
// animation at the cut.
export function videoExitAge(
  shots: Shot[],
  seconds: number,
  leaves: HistoryTime
): number | null {
  const place = shotAt(shots, seconds);
  const moment = historyAt(shots, seconds);
  if (!place || moment === null || moment < leaves) return null;
  const starts = shotStarts(shots);
  let i = place.index;
  let local = place.local;
  for (;;) {
    const shot = shots[i];
    if (shot.from < leaves) {
      // Crossed during this shot: find when, by halving (a shot only moves forwards in time)
      let low = 0;
      let high = local;
      for (let k = 0; k < 40; k++) {
        const mid = (low + high) / 2;
        const at = shot.from + (shot.to - shot.from) * shotProgress(shot, mid);
        if (at < leaves) low = mid;
        else high = mid;
      }
      return Math.max(0, seconds - (starts[i] + high));
    }
    const before = i > 0 ? shots[i - 1] : null;
    if (before && Math.abs(before.to - shot.from) < SAME_MOMENT) {
      i -= 1;
      local = before.seconds;
      continue;
    }
    return shot.from - leaves < SAME_MOMENT
      ? Math.max(0, seconds - starts[i])
      : Infinity;
  }
}

// The same in history mode, where the playhead plays `pace` days of history a second: so
// scrubbing and playing show the animation at the speed playback would
export function historyExitAge(
  moment: HistoryTime,
  leaves: HistoryTime,
  pace: number
): number | null {
  return moment < leaves ? null : (moment - leaves) / Math.max(pace, 1e-9);
}

// ---- Where ----

export interface Place {
  x: number;
  y: number;
  rotation: number;
  flipped: boolean;
}

const placeCache = new WeakMap<Timeline, Map<string, Place>>();

// Where a unit is as it leaves: wherever its marches had taken it then, or where it was placed.
// Worked out once per timeline.
export function leavingPlace(timeline: Timeline, unit: Unit): Place {
  let cache = placeCache.get(timeline);
  if (!cache) {
    cache = new Map();
    placeCache.set(timeline, cache);
  }
  const key = `${unit.id}@${unit.leaves}`;
  const known = cache.get(key);
  if (known) return known;
  const state =
    unit.leaves !== undefined
      ? timeline.stateAt(unit.leaves).get(unit.id)
      : undefined;
  const place: Place = state
    ? {
        x: state.x,
        y: state.y,
        rotation: state.rotation,
        flipped: state.flipped,
      }
    : {
        x: unit.x,
        y: unit.y,
        rotation: unit.rotation,
        flipped: !!unit.flipped,
      };
  cache.set(key, place);
  return place;
}

// How wide a unit's picture is at scale 1, in map units. The same as the editor's unit layer
// and the renderer's UNIT_WIDTH.
export const UNIT_IMAGE_WIDTH = 48;

// A unit leaving at a moment: where it stands (as it was when it left, its block thinned as it
// was then), and how far through its animation it is (0 to 1)
export interface Leaving {
  unit: Unit;
  progress: number;
  age: number; // seconds of video since it left
}

// The units part way through leaving at a moment. `ageOf` says how many seconds of video ago
// a unit left (see videoExitAge and historyExitAge).
export function leavingAt(
  units: Unit[],
  timeline: Timeline,
  moment: HistoryTime,
  ageOf: (unit: Unit) => number | null
): Leaving[] {
  const out: Leaving[] = [];
  for (const unit of units) {
    if (!unit.exit || unit.leaves === undefined || moment < unit.leaves)
      continue;
    if ((unit.appears ?? -Infinity) > unit.leaves) continue;
    const age = ageOf(unit) ?? Infinity;
    const progress = age / exitSeconds(unit.exit);
    if (!(progress < 1)) continue;
    const place = leavingPlace(timeline, unit);
    out.push({
      unit: unitAt({ ...unit, ...place }, unit.leaves),
      progress,
      age,
    });
  }
  return out;
}

// ---- Markers ----

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

// ---- The animation ----

// One piece of a unit part way through leaving. The unit's picture is drawn whole, cut to
// `clip` (a polygon over the picture's box, 0 to 1 across and down; null for all of it), then
// moved by `x`, `y` (in the box's widths, so pieces move the same in the editor and video),
// turned by `rotate` degrees and sized by `scale` about `origin` (0 to 1 across and down the
// box), and faded to `alpha`.
export interface ExitPiece {
  clip: P[] | null;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  origin: P;
  alpha: number;
}

// Everything drawn for a unit part way through leaving: its pieces, any tear lines over them
// (in the box, 0 to 1), and any ripples round it (radius in the box's widths)
export interface ExitFrame {
  pieces: ExitPiece[];
  tears: { points: P[]; alpha: number }[];
  ripples: { radius: number; alpha: number }[];
}

const CENTRE: P = { x: 0.5, y: 0.5 };
const whole = (patch: Partial<ExitPiece>): ExitPiece => ({
  clip: null,
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1,
  origin: CENTRE,
  alpha: 1,
  ...patch,
});

const easeIn = (t: number) => t * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
// 0 before `from`, 1 after `to`, rising steadily between
const between = (t: number, from: number, to: number) =>
  clamp((t - from) / (to - from), 0, 1);

// A jagged line from `a` to `b`: the middle pushed side to side, the ends where they are
function jagged(
  a: P,
  b: P,
  steps: number,
  wobble: number,
  random: () => number
): P[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const side = { x: -dy / length, y: dx / length };
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const push = i === 0 || i === steps ? 0 : (random() - 0.5) * 2 * wobble;
    return { x: a.x + dx * t + side.x * push, y: a.y + dy * t + side.y * push };
  });
}

// The first share of a polyline, by length
function partOf(points: P[], share: number): P[] {
  if (share >= 1) return points;
  if (share <= 0) return [points[0]];
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let left = lengths.reduce((a, b) => a + b, 0) * share;
  const out: P[] = [points[0]];
  for (let i = 0; i < lengths.length; i++) {
    if (left >= lengths[i]) {
      out.push(points[i + 1]);
      left -= lengths[i];
      continue;
    }
    const t = lengths[i] > 0 ? left / lengths[i] : 0;
    out.push({
      x: points[i].x + (points[i + 1].x - points[i].x) * t,
      y: points[i].y + (points[i + 1].y - points[i].y) * t,
    });
    break;
  }
  return out;
}

const centroid = (points: P[]): P => ({
  x: points.reduce((s, p) => s + p.x, 0) / points.length,
  y: points.reduce((s, p) => s + p.y, 0) / points.length,
});

// The shards a unit breaks into: a 3 by 3 grid with its inner corners pushed about, each cell
// cut corner to corner into two triangles
function shards(random: () => number): P[][] {
  const n = 3;
  const grid: P[][] = [];
  for (let row = 0; row <= n; row++) {
    grid.push([]);
    for (let col = 0; col <= n; col++) {
      const inside = row > 0 && row < n && col > 0 && col < n;
      const nudge = () => (inside ? (random() - 0.5) * 0.18 : 0);
      grid[row].push({ x: col / n + nudge(), y: row / n + nudge() });
    }
  }
  const out: P[][] = [];
  for (let row = 0; row < n; row++)
    for (let col = 0; col < n; col++) {
      const a = grid[row][col];
      const b = grid[row][col + 1];
      const c = grid[row + 1][col + 1];
      const d = grid[row + 1][col];
      if ((row + col) % 2 === 0) out.push([a, b, c], [a, c, d]);
      else out.push([a, b, d], [b, c, d]);
    }
  return out;
}

// The four pieces a paper tear leaves, and the two tears: one from the top left corner to the
// bottom right, one from the top right to the bottom left, crossing in the middle
function tearShape(random: () => number) {
  const tl = { x: 0, y: 0 };
  const tr = { x: 1, y: 0 };
  const br = { x: 1, y: 1 };
  const bl = { x: 0, y: 1 };
  const steps = 7;
  const wobble = 0.035;
  const a1 = jagged(tl, CENTRE, steps, wobble, random); // top left to the middle
  const a2 = jagged(CENTRE, br, steps, wobble, random); // the middle to bottom right
  const b1 = jagged(tr, CENTRE, steps, wobble, random); // top right to the middle
  const b2 = jagged(CENTRE, bl, steps, wobble, random); // the middle to bottom left
  const rev = (points: P[]) => [...points].reverse();
  const pieces = [
    { clip: [...a1, ...rev(b1).slice(1)], away: { x: 0, y: -1 } }, // top
    { clip: [...b1, ...a2.slice(1)], away: { x: 1, y: 0 } }, // right
    { clip: [...rev(a2), ...b2.slice(1)], away: { x: 0, y: 1 } }, // bottom
    { clip: [...rev(b2), ...rev(a1).slice(1)], away: { x: -1, y: 0 } }, // left
  ];
  return {
    pieces,
    tears: [
      [...a1, ...a2.slice(1)],
      [...b1, ...b2.slice(1)],
    ],
  };
}

// What a unit looks like `progress` (0 to 1) of the way through leaving. `id` makes its pieces
// the same every time; `back` is the way it faces away from, in degrees in its own picture's
// space (for a rout); `aspect` is the picture's height over its width.
export function exitFrame(
  style: ExitStyle,
  progress: number,
  id: string,
  back: number,
  aspect: number
): ExitFrame {
  const p = clamp(progress, 0, 1);
  const random = seeded(`${style}:${id}`);
  const side = random() < 0.5 ? -1 : 1;
  const none = { tears: [], ripples: [] };
  switch (style) {
    case "fade":
      return { pieces: [whole({ alpha: 1 - p })], ...none };
    case "fall": {
      // topples about its foot, then fades as it lands
      const lean = side * 82 * easeIn(p);
      return {
        pieces: [
          whole({
            rotate: lean,
            origin: { x: 0.5, y: 1 },
            scale: 1 - 0.08 * p,
            alpha: 1 - between(p, 0.55, 1),
          }),
        ],
        ...none,
      };
    }
    case "shatter": {
      const pieces = shards(random).map((clip) => {
        const c = centroid(clip);
        const dx = c.x - 0.5;
        const dy = (c.y - 0.5) * aspect;
        const length = Math.hypot(dx, dy) || 1;
        const reach = (0.25 + random() * 0.5) * easeOut(p);
        const spin = (random() - 0.5) * 260 * p;
        return {
          clip,
          x: (dx / length) * reach,
          y: (dy / length) * reach,
          rotate: spin,
          scale: 1 - 0.35 * p,
          origin: c,
          alpha: 1 - between(p, 0.2, 1),
        };
      });
      return { pieces, ...none };
    }
    case "sink": {
      const ripples = [0, 0.25, 0.5]
        .map((start) => between(p, start, start + 0.5))
        .filter((t) => t > 0 && t < 1)
        .map((t) => ({ radius: 0.3 + 0.55 * t, alpha: 0.7 * (1 - t) }));
      return {
        pieces: [
          whole({
            rotate: side * 22 * easeOut(p),
            scale: 1 - 0.55 * easeIn(p),
            y: 0.06 * p,
            alpha: 1 - between(p, 0.3, 0.95),
          }),
        ],
        tears: [],
        ripples,
      };
    }
    case "rout": {
      const angle = (back * Math.PI) / 180;
      const run = 0.9 * easeIn(p);
      const flicker = Math.sin(p * Math.PI * 14) > 0 ? 1 : 0.45;
      const fade = 1 - between(p, 0.15, 1);
      return {
        pieces: [
          whole({
            x: Math.cos(angle) * run + Math.sin(p * 40) * 0.015,
            y: Math.sin(angle) * run,
            alpha: fade * (p < 0.08 ? 1 : flicker),
          }),
        ],
        ...none,
      };
    }
    case "tear": {
      // the tears run from both top corners to the opposite bottom ones, then the four pieces
      // part and fall away
      const shape = tearShape(random);
      const ripping = between(p, 0, 0.5);
      const parting = between(p, 0.5, 1);
      const pieces = shape.pieces.map(({ clip, away }, i) => ({
        clip,
        x: away.x * 0.3 * easeOut(parting),
        y: away.y * 0.3 * easeOut(parting) + 0.5 * easeIn(parting),
        rotate: (i % 2 === 0 ? side : -side) * 28 * parting,
        scale: 1,
        origin: centroid(clip),
        alpha: 1 - between(parting, 0.3, 1),
      }));
      const tearAlpha = 1 - between(parting, 0, 0.35);
      const tears =
        tearAlpha > 0
          ? shape.tears.map((points) => ({
              points: partOf(points, ripping),
              alpha: tearAlpha,
            }))
          : [];
      return { pieces, tears, ripples: [] };
    }
  }
}

// A unit's picture's height over its width, which its pieces are worked out over. A block's
// is known; an image's isn't until it loads, so images count as square (only how shards spread
// depends on it).
export function pictureAspect(unit: Pick<Unit, "block">): number {
  if (!unit.block) return 1;
  const box = blockBox(unit.block);
  return box.height / box.width;
}

// The way a unit faces away from, in its own picture's space (before it's turned on the map),
// for a rout. Blocks face up, so they run down.
export function backAngle(unit: Unit): number {
  if (unit.block) return 90;
  return effectiveForward(unitFacing(unit).forwardAngle, !!unit.flipped) + 180;
}

// A smooth closed curve through the middles of a ragged outline's sides, each corner a
// control point: how a patch marker is drawn in the editor and the video alike
export function smoothClosed(points: P[]): {
  start: P;
  curves: { control: P; to: P }[];
} {
  const mid = (a: P, b: P) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const n = points.length;
  return {
    start: mid(points[n - 1], points[0]),
    curves: points.map((p, i) => ({
      control: p,
      to: mid(p, points[(i + 1) % n]),
    })),
  };
}

// A cross marker's two strokes, upright, centred on its spot, for a cross `size` tall
export function crossStrokes(size: number): [P, P][] {
  return [
    [
      { x: 0, y: -0.55 * size },
      { x: 0, y: 0.6 * size },
    ],
    [
      { x: -0.32 * size, y: -0.18 * size },
      { x: 0.32 * size, y: -0.18 * size },
    ],
  ];
}

// The colours markers and tears are drawn in
export const MARKER_INK = "#2b1f16";
export const MARKER_HALO = "rgba(250, 244, 228, 0.75)";
export const PATCH_FILL = "rgba(48, 32, 20, 0.38)";
export const TEAR_EDGE = "#fbf6e9";
export const TEAR_SHADOW = "rgba(30, 20, 10, 0.55)";
export const RIPPLE = "rgba(235, 245, 255, 1)";
// How thick a ripple ring is, as a share of the unit's width, so it looks the same in the
// editor and the video at any zoom
export const RIPPLE_WIDTH = 0.05;
