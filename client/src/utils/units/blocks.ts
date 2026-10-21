import {
  BlockColour,
  BlockKind,
  BlockLoss,
  FormationBlock,
  PathPoint,
  Unit,
} from "../../types";
import { HistoryTime } from "../history/historyTime";
import { normalizeDegrees } from "../marches/unitFacing";

// Formation blocks: troops drawn as history books draw them, a rectangle in the faction's
// colour with a darker edge, a thicker front edge, a symbol for what kind of troops they are,
// and a name. Everything here is shared by the editor (BlockShape) and the video renderer
// (drawFrame), so both draw a block exactly alike.
//
// A block is drawn in its own space, centred on (0, 0), with its front along the top (it
// faces up, like unit art). It is `width` wide and `depth` deep; `bend` bows the front and the
// back alike, so the block stays the same depth all the way along: a curve with its middle
// forward (bend > 0) or a crescent with its ends forward (bend < 0).

type P = PathPoint;

// ---- Colours and kinds ----

export const BLOCK_COLOURS: {
  colour: BlockColour;
  label: string;
  fill: string;
  edge: string;
}[] = [
  { colour: "purple", label: "Purple", fill: "#7d4fa3", edge: "#4a2a66" },
  { colour: "red", label: "Red", fill: "#c0413b", edge: "#7a2220" },
  { colour: "blue", label: "Blue", fill: "#3b6fc0", edge: "#203f78" },
  { colour: "green", label: "Green", fill: "#4c9a46", edge: "#2a5c27" },
  { colour: "yellow", label: "Yellow", fill: "#e0c13c", edge: "#8f7718" },
  { colour: "orange", label: "Orange", fill: "#e07f30", edge: "#8c4614" },
  { colour: "pink", label: "Pink", fill: "#e07fb0", edge: "#94456e" },
  { colour: "grey", label: "Grey", fill: "#8c8c8c", edge: "#4d4d4d" },
  { colour: "cyan", label: "Cyan", fill: "#3fb5c4", edge: "#1d6d78" },
];

export const blockColours = (colour: BlockColour) =>
  BLOCK_COLOURS.find((c) => c.colour === colour) ?? BLOCK_COLOURS[0];

export const BLOCK_KINDS: { kind: BlockKind; label: string; hint: string }[] = [
  {
    kind: "foot",
    label: "Foot",
    hint: "Foot soldiers: a cross through the block",
  },
  {
    kind: "horse",
    label: "Horse",
    hint: "Horsemen: one diagonal through the block",
  },
  {
    kind: "archers",
    label: "Archers",
    hint: "Archers and other missile troops: a row of dots along the front",
  },
  { kind: "plain", label: "Plain", hint: "No symbol" },
];

export const blockKindLabel = (kind: BlockKind) =>
  BLOCK_KINDS.find((k) => k.kind === kind)?.label ?? "Block";

// ---- Sizes ----

export const BLOCK_WIDTH = { min: 20, max: 1000, start: 160 };
export const BLOCK_DEPTH = { min: 8, max: 400, start: 50 };
// A bend can't bow further than half the block's width
export const maxBend = (width: number) => width / 2;
// A bend this close to straight snaps straight, so it's easy to undo a bend by dragging
export const BEND_SNAP = 3;

const clamp = (n: number, low: number, high: number) =>
  Math.min(high, Math.max(low, n));

// A block with its sizes kept in range
export function tidyBlock(block: FormationBlock): FormationBlock {
  const width = Math.round(
    clamp(block.width, BLOCK_WIDTH.min, BLOCK_WIDTH.max)
  );
  const depth = Math.round(
    clamp(block.depth, BLOCK_DEPTH.min, BLOCK_DEPTH.max)
  );
  const rawBend = clamp(block.bend ?? 0, -maxBend(width), maxBend(width));
  const bend = Math.abs(rawBend) < BEND_SNAP ? 0 : Math.round(rawBend);
  const { bend: _old, name, size, losses, ...rest } = block;
  const out: FormationBlock = { ...rest, width, depth };
  if (bend !== 0) out.bend = bend;
  if (name?.trim()) out.name = name.trim();
  if (size?.trim()) out.size = size.trim();
  const kept = tidyLosses(losses);
  if (kept.length > 0) out.losses = kept;
  return out;
}

// ---- Losses ----

// The most a block can lose, all its losses together: something is always left to see
export const MAX_LOSS = 0.95;
// The smallest single loss
export const MIN_LOSS = 0.01;

const isNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

// A block's losses made usable: real dates the right way round, each share in range, all of
// them together no more than MAX_LOSS (scaled down evenly if they'd be more), in date order
export function tidyLosses(losses: BlockLoss[] | undefined): BlockLoss[] {
  if (!Array.isArray(losses)) return [];
  const usable = losses
    .filter(
      (l) => l && isNumber(l.start) && isNumber(l.end) && isNumber(l.share)
    )
    .map((l) => ({
      start: Math.min(l.start, l.end),
      end: Math.max(l.start, l.end),
      share: clamp(l.share, MIN_LOSS, MAX_LOSS),
    }))
    .sort((a, b) => a.start - b.start);
  const total = usable.reduce((sum, l) => sum + l.share, 0);
  if (total <= MAX_LOSS)
    return usable.map((l) => ({
      ...l,
      share: Math.round(l.share * 100) / 100,
    }));
  return usable.map((l) => ({
    ...l,
    share: Math.floor((l.share * MAX_LOSS * 100) / total) / 100,
  }));
}

// How much of a block is left at a moment: 1 at full strength, less as its losses go by
// (each a steady loss from its start to its end)
export function blockStrength(b: FormationBlock, t: HistoryTime): number {
  let lost = 0;
  for (const l of b.losses ?? []) {
    const through =
      t <= l.start
        ? 0
        : t >= l.end || l.end <= l.start
          ? 1
          : (t - l.start) / (l.end - l.start);
    lost += l.share * through;
  }
  return clamp(1 - lost, 1 - MAX_LOSS, 1);
}

// The number in a size, counted down to a share of itself and rounded the way people round
// troop numbers: "c. 2,000" at 0.6 reads "c. 1,200". Text with no number stays as it is.
export function sizeAtStrength(size: string, strength: number): string {
  const match = /\d[\d,]*/.exec(size);
  if (!match || strength >= 1) return size;
  const n = Number(match[0].replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return size;
  const step = n >= 1000 ? 50 : n >= 100 ? 10 : 1;
  const value = Math.max(0, Math.round((n * strength) / step) * step);
  const text =
    match[0].includes(",") || value >= 10000
      ? value.toLocaleString("en-US")
      : String(value);
  return (
    size.slice(0, match.index) +
    text +
    size.slice(match.index + match[0].length)
  );
}

// How a block looks at a moment once its losses are counted: thinner from the back (its front
// stays where it was) with its size counted down. `forward` is how far its middle has moved
// towards its front as its back edge comes up, in its own space. Null while it's at full
// strength.
export function thinnedBlock(
  b: FormationBlock,
  t: HistoryTime
): { block: FormationBlock; forward: number } | null {
  const strength = blockStrength(b, t);
  if (strength >= 1) return null;
  const depth = Math.max(4, b.depth * strength);
  const block: FormationBlock = { ...b, depth };
  if (b.size) block.size = sizeAtStrength(b.size, strength);
  return { block, forward: (b.depth - depth) / 2 };
}

// A unit as it stands at a moment, its block thinned by its losses: the block, and its middle
// moved towards its front as its back edge comes up (turned with the unit)
export function unitAt<
  T extends Pick<Unit, "x" | "y" | "rotation" | "scale" | "block">,
>(unit: T, t: HistoryTime): T {
  if (!unit.block?.losses) return unit;
  const thin = thinnedBlock(unit.block, t);
  if (!thin) return unit;
  const turn = (unit.rotation * Math.PI) / 180;
  const forward = thin.forward * unit.scale;
  return {
    ...unit,
    block: thin.block,
    x: unit.x + Math.sin(turn) * forward,
    y: unit.y - Math.cos(turn) * forward,
  };
}

// What a new block starts as
export const newBlockSpec = (
  spec: Partial<FormationBlock> = {}
): FormationBlock =>
  tidyBlock({
    kind: "foot",
    colour: "red",
    width: BLOCK_WIDTH.start,
    depth: BLOCK_DEPTH.start,
    ...spec,
  });

// A placed block, as a unit, so it marches along paths, joins armies and comes and goes on the
// timeline like any other
export function blockUnit(
  block: FormationBlock,
  x: number,
  y: number,
  id?: string
): Unit {
  return {
    id: id ?? `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    filename: "block",
    path: "",
    assetType: "units",
    x,
    y,
    rotation: 0,
    scale: 1,
    block: tidyBlock(block),
  };
}

// What a unit is called in lists: a block by its name (or its kind), a picture by its file
export const unitLabel = (unit: Unit) =>
  unit.block
    ? unit.block.name || `${blockKindLabel(unit.block.kind)} block`
    : unit.filename.replace(/\.[^/.]+$/, "");

// ---- Shape ----

// The front and back edges' height at x across the block: the middle bowed by `bend`
const frontY = (b: FormationBlock, x: number) =>
  -b.depth / 2 - (b.bend ?? 0) * (1 - ((2 * x) / b.width) ** 2);
const backY = (b: FormationBlock, x: number) =>
  b.depth / 2 - (b.bend ?? 0) * (1 - ((2 * x) / b.width) ** 2);

// The block's outline, as pieces any drawing surface can follow: a curve from one corner
// through a control point to the next, or a straight line. Starts at the front left corner.
export type BlockStep =
  | { op: "move"; to: P }
  | { op: "line"; to: P }
  | { op: "curve"; control: P; to: P };

export function blockOutline(b: FormationBlock): BlockStep[] {
  const w = b.width / 2;
  const d = b.depth / 2;
  const bend = b.bend ?? 0;
  return [
    { op: "move", to: { x: -w, y: -d } },
    { op: "curve", control: { x: 0, y: -d - 2 * bend }, to: { x: w, y: -d } },
    { op: "line", to: { x: w, y: d } },
    { op: "curve", control: { x: 0, y: d - 2 * bend }, to: { x: -w, y: d } },
  ];
}

// The front edge alone, drawn thicker so you can tell which way the block faces
export function blockFront(b: FormationBlock): BlockStep[] {
  return blockOutline(b).slice(0, 2);
}

// Steps as SVG path data (closed when `close`)
export function stepsPath(steps: BlockStep[], close = false): string {
  const n = (v: number) => Math.round(v * 100) / 100;
  return (
    steps
      .map((s) =>
        s.op === "move"
          ? `M${n(s.to.x)} ${n(s.to.y)}`
          : s.op === "line"
            ? `L${n(s.to.x)} ${n(s.to.y)}`
            : `Q${n(s.control.x)} ${n(s.control.y)} ${n(s.to.x)} ${n(s.to.y)}`
      )
      .join("") + (close ? "Z" : "")
  );
}

// The symbol inside the block, following its bend: lines (runs of points) and dots
export interface BlockSymbol {
  lines: P[][];
  dots: { x: number; y: number; r: number }[];
}

// A line across the block from one side to the other, going `from` (0 front, 1 back) at the
// left to `to` at the right, bending with the block
function across(b: FormationBlock, from: number, to: number): P[] {
  const steps = 16;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const x = -b.width / 2 + t * b.width;
    const share = from + (to - from) * t;
    return { x, y: frontY(b, x) + (backY(b, x) - frontY(b, x)) * share };
  });
}

export function blockSymbol(b: FormationBlock): BlockSymbol {
  switch (b.kind) {
    case "foot":
      return { lines: [across(b, 0, 1), across(b, 1, 0)], dots: [] };
    case "horse":
      return { lines: [across(b, 1, 0)], dots: [] };
    case "archers": {
      const r = clamp(b.depth * 0.07, 1.2, 5);
      const gap = Math.max(r * 4, 8);
      const count = Math.max(1, Math.floor((b.width - gap) / gap));
      const start = -((count - 1) * gap) / 2;
      const dots = Array.from({ length: count }, (_, i) => {
        const x = start + i * gap;
        return { x, y: frontY(b, x) + Math.min(b.depth * 0.22, r * 3 + 2), r };
      });
      return { lines: [], dots };
    }
    default:
      return { lines: [], dots: [] };
  }
}

// How wide the block's edge lines are: the outline, and the thicker front
export const blockLineWidths = (b: FormationBlock) => {
  const edge = clamp(Math.min(b.width, b.depth) * 0.05, 1, 2.5);
  return { edge, front: edge * 2.4, symbol: edge * 0.9 };
};

// ---- Label ----

// The font the labels are drawn in: the same in the editor and the video
export const BLOCK_FONT =
  'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MIN_FONT = 6;
const MAX_FONT = 30;
// About how wide a bold character is, as a share of the font's size
const CHAR_WIDTH = 0.58;

export interface LabelLine {
  text: string;
  y: number; // the middle of the line, in the label's own space (see blockLabel)
  size: number; // font size in map units
  bold: boolean;
}

// Where the name and size go: in the middle of the block, as big as fits (two lines if there's
// room, the name alone if not), or just behind the block when it's too thin for any text.
// `flip` turns the text half a turn so it's never upside down on screen; `y` is the label's
// middle in the block's space.
export interface BlockLabel {
  lines: LabelLine[];
  y: number;
  flip: boolean;
}

export function blockLabel(
  b: FormationBlock,
  rotation: number
): BlockLabel | null {
  const texts = [b.name?.trim(), b.size?.trim()].filter(
    (t): t is string => !!t
  );
  if (texts.length === 0) return null;
  // upright on screen: the block's own up turned by its rotation points down the screen
  const flip = Math.abs(normalizeDegrees(rotation)) > 90;
  const fitWidth = (text: string, room: number) =>
    room / Math.max(1, text.length * CHAR_WIDTH);
  const room = b.width * 0.86;
  const middle = -(b.bend ?? 0); // the middle of the band, at its centre line
  // Both lines inside, the size line a little smaller
  const both = (size: number) => size * 2.25;
  let name = Math.min(MAX_FONT, fitWidth(texts[0], room), b.depth * 0.42);
  if (texts.length === 2) {
    name = Math.min(name, fitWidth(texts[1], room) / 0.8);
    if (both(name) > b.depth * 0.86)
      name = Math.min(name, (b.depth * 0.86) / 2.25);
  }
  if (name >= MIN_FONT) {
    const lines: LabelLine[] =
      texts.length === 2
        ? [
            { text: texts[0], y: -name * 0.55, size: name, bold: true },
            { text: texts[1], y: name * 0.7, size: name * 0.8, bold: false },
          ]
        : [{ text: texts[0], y: 0, size: name, bold: true }];
    return { lines, y: middle, flip };
  }
  // Too thin: the text goes just behind the block, at a readable size
  const size = Math.max(
    MIN_FONT + 2,
    Math.min(14, fitWidth(texts[0], b.width * 1.4))
  );
  const lines: LabelLine[] = texts.map((text, i) => ({
    text,
    y: i * size * 1.15,
    size: i === 0 ? size : size * 0.8,
    bold: i === 0,
  }));
  const behind = b.depth / 2 + Math.max(0, -(b.bend ?? 0)) + size * 0.9;
  return { lines, y: behind, flip };
}

// ---- Handles ----

// Where the editing handles go in the block's space: the sides (width), the back (depth) and
// the front (bend)
export function blockHandles(b: FormationBlock): {
  left: P;
  right: P;
  back: P;
  front: P;
} {
  return {
    left: { x: -b.width / 2, y: 0 },
    right: { x: b.width / 2, y: 0 },
    back: { x: 0, y: backY(b, 0) },
    front: { x: 0, y: frontY(b, 0) },
  };
}

export type BlockHandle = "left" | "right" | "back" | "front";

// The block with one handle dragged to `at` (in the block's space). The sides widen it about
// its middle, the back deepens it, the front bends it.
export function dragBlockHandle(
  b: FormationBlock,
  handle: BlockHandle,
  at: P
): FormationBlock {
  const bend = b.bend ?? 0;
  switch (handle) {
    case "left":
    case "right":
      return tidyBlock({ ...b, width: 2 * Math.abs(at.x) });
    case "back":
      return tidyBlock({ ...b, depth: 2 * (at.y + bend) });
    case "front":
      return tidyBlock({ ...b, bend: -at.y - b.depth / 2 });
  }
}

// Room round a block's picture for its thick front edge and a selection outline
export const BLOCK_PAD = 6;

// The box a block's picture fills, centred on the block (see BlockShape). Leaving animations
// are worked out over this box, so they look the same in the editor and the video.
export function blockBox(b: FormationBlock): { width: number; height: number } {
  const { halfWidth, halfHeight } = blockReach(b);
  return {
    width: 2 * (halfWidth + BLOCK_PAD),
    height: 2 * (halfHeight + BLOCK_PAD),
  };
}

// How far the block reaches from its middle, up and down and to the sides: the size of the
// picture it needs, kept centred on the block
export function blockReach(b: FormationBlock): {
  halfWidth: number;
  halfHeight: number;
} {
  return {
    halfWidth: b.width / 2,
    halfHeight: b.depth / 2 + Math.abs(b.bend ?? 0),
  };
}
