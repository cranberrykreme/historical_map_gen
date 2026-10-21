// Leaving: the animation itself, the pieces a unit breaks into and how they move

import { ExitStyle, PathPoint, Unit } from "../../types";
import { effectiveForward, unitFacing } from "../marches/unitFacing";
import { blockBox } from "./blocks";
import { clamp } from "./exitStyles";
import { seeded } from "./markers";

type P = PathPoint;

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
