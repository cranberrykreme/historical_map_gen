import { BattleKind, PathPoint, TerrainFeature, TerrainStyle } from "../types";
import {
  alongLine,
  areaCentre,
  GROUND_COLOUR,
  holesPath,
  polylinePath,
  sampleCurve,
  shrink,
  smoothPath,
  TERRAIN_PATTERNS,
  TerrainStroke,
} from "./terrain";

// A battle's terrain style: the same terrain, drawn in another look. Each style recolours
// every colour the terrain is drawn with (so every kind, and every way kinds meet, changes
// together), and some draw a little more on top: hachures or contour lines on high ground,
// paper grain, darker edges.

export interface TerrainStyleInfo {
  id: TerrainStyle;
  label: string;
  hint: string;
}

export const TERRAIN_STYLES: TerrainStyleInfo[] = [
  {
    id: "painted",
    label: "Painted",
    hint: "Full colour, lit from the top left",
  },
  {
    id: "autumn",
    label: "Autumn",
    hint: "Golden and russet woods, browning grass",
  },
  {
    id: "winter",
    label: "Winter",
    hint: "Frosty, pale and cold, the woods bare and dark",
  },
  {
    id: "arid",
    label: "Arid",
    hint: "Sun-baked: dry grass, olive scrub, turquoise water",
  },
  { id: "night", label: "Night", hint: "Dark and blue, as by moonlight" },
  {
    id: "parchment",
    label: "Parchment",
    hint: "An old map in brown ink on aged paper, hills drawn with hachures",
  },
  {
    id: "ink",
    label: "Ink",
    hint: "A black pen drawing on white paper, with hachures",
  },
  {
    id: "textbook",
    label: "Textbook",
    hint: "A flat school-atlas map, hills drawn with contour lines",
  },
];

export const DEFAULT_TERRAIN_STYLE: TerrainStyle = "painted";

export const isTerrainStyle = (value: unknown): value is TerrainStyle =>
  TERRAIN_STYLES.some((s) => s.id === value);

export const styleInfo = (style: TerrainStyle = DEFAULT_TERRAIN_STYLE) =>
  TERRAIN_STYLES.find((s) => s.id === style) ?? TERRAIN_STYLES[0];

// ---- Colours ----

type Rgb = [number, number, number];
interface Hsl {
  h: number; // 0 to 360
  s: number; // 0 to 1
  l: number; // 0 to 1
}

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// Turns hue `a` towards `b` the short way round the colour wheel
const lerpHue = (a: number, b: number, t: number) => {
  const turn = ((((b - a) % 360) + 540) % 360) - 180;
  return (a + turn * t + 360) % 360;
};

function parseHex(colour: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(colour.trim());
  if (!m) return null;
  const hex =
    m[1].length === 3
      ? m[1]
          .split("")
          .map((c) => c + c)
          .join("")
      : m[1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
}

const toHex = (rgb: Rgb) =>
  "#" +
  rgb
    .map((v) =>
      Math.round(clamp(v, 0, 255))
        .toString(16)
        .padStart(2, "0")
    )
    .join("");

function toHsl([r, g, b]: Rgb): Hsl {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === R
      ? ((G - B) / d + (G < B ? 6 : 0)) * 60
      : max === G
        ? ((B - R) / d + 2) * 60
        : ((R - G) / d + 4) * 60;
  return { h, s, l };
}

function fromHsl({ h, s, l }: Hsl): Rgb {
  s = clamp(s);
  l = clamp(l);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const k = h / 360;
  return [channel(k + 1 / 3), channel(k), channel(k - 1 / 3)].map(
    (v) => v * 255
  ) as Rgb;
}

// How bright a colour looks, 0 to 1
const brightness = ([r, g, b]: Rgb) =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

// How much of a colour is green (grass, trees) or blue (water), 0 to 1
const greenness = ({ h, s }: Hsl) =>
  s < 0.1 ? 0 : clamp((h - 50) / 15) * clamp((175 - h) / 15);
const blueness = ({ h, s }: Hsl) =>
  s < 0.15 ? 0 : clamp((h - 175) / 12) * clamp((255 - h) / 12);

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

// A one-ink look: every colour becomes a shade between the ink and the paper by how bright
// it is, with water keeping a faint tint
function monochrome(
  ink: Rgb,
  paper: Rgb,
  water: Rgb,
  lift: number,
  gain = 1
): (rgb: Rgb) => Rgb {
  return (rgb) => {
    const t = clamp(lift + (1 - lift) * gain * brightness(rgb) ** 0.9);
    const shade = mix(ink, paper, t);
    const blue = blueness(toHsl(rgb));
    return blue > 0 ? mix(shade, water, 0.45 * blue) : shade;
  };
}

const PARCHMENT_INK: Rgb = [70, 46, 24];
const PARCHMENT_PAPER: Rgb = [238, 224, 190];
const INK_INK: Rgb = [24, 24, 30];
const INK_PAPER: Rgb = [250, 249, 244];

interface StyleRecipe {
  recolour: (rgb: Rgb) => Rgb;
  keepBlackWhite?: boolean; // pure white and black (light and shadow) stay as they are
  flat?: boolean; // no hill shading or shadows
  highGround?: "hachures" | "contours"; // drawn over hills, mountains and ridges
  ink?: string; // the colour those are drawn in
  paper?: boolean; // grain over everything
  vignette?: string; // edges darkened to this colour
}

const RECIPES: Record<TerrainStyle, StyleRecipe> = {
  painted: { recolour: (rgb) => rgb, keepBlackWhite: true },
  autumn: {
    keepBlackWhite: true,
    recolour: (rgb) => {
      const c = toHsl(rgb);
      const g = greenness(c);
      if (g > 0) {
        // darker leaves go russet, lighter ones gold; grass goes olive-gold
        const target = 6 + c.l * 65;
        const amount = clamp(1.35 - c.l, 0.5, 0.95) * g;
        const leaves = c.l < 0.4;
        return fromHsl({
          h: lerpHue(c.h, target, amount),
          s: Math.min(1, c.s * (1 + (leaves ? 0.4 : -0.1) * g)),
          l: c.l * (1 + 0.06 * g),
        });
      }
      if (blueness(c) > 0) return fromHsl({ ...c, s: c.s * 0.8 });
      return rgb;
    },
  },
  winter: {
    keepBlackWhite: true,
    recolour: (rgb) => {
      const c = toHsl(rgb);
      const g = greenness(c);
      const b = blueness(c);
      if (b > 0)
        return fromHsl({
          h: lerpHue(c.h, 208, 0.5 * b),
          s: c.s * (1 - 0.45 * b),
          l: c.l * (1 - 0.12 * b),
        });
      // dark (trees) stays dark and goes grey-green, light (grass) goes frosty pale
      const frost = c.l > 0.4 ? 0.55 : 0.15;
      return fromHsl({
        h: lerpHue(c.h, 95, 0.3 * g),
        s: c.s * (1 - 0.65 * Math.max(g, 0.4)),
        l: c.l + (0.88 - c.l) * frost,
      });
    },
  },
  arid: {
    keepBlackWhite: true,
    recolour: (rgb) => {
      const c = toHsl(rgb);
      const g = greenness(c);
      const b = blueness(c);
      if (b > 0)
        return fromHsl({
          h: lerpHue(c.h, 184, 0.65 * b),
          s: Math.min(1, c.s * (1 + 0.15 * b)),
          l: c.l * (1 + 0.06 * b),
        });
      // trees keep a dusty olive, grass dries to straw
      const grass = c.l > 0.4;
      return fromHsl({
        h: lerpHue(
          c.h,
          grass ? 42 : 70,
          (grass ? 0.9 : 0.7) * g + 0.15 * (1 - g)
        ),
        s: c.s * (1 - (grass ? 0.05 : 0.3) * g),
        l: Math.min(0.92, c.l + 0.07 + 0.05 * g),
      });
    },
  },
  night: {
    keepBlackWhite: true,
    vignette: "#03060d",
    // mostly grey, then dimmed through a blue glass
    recolour: (rgb) => {
      const grey = brightness(rgb) * 255;
      const [r, g, b] = mix(rgb, [grey, grey, grey], 0.6);
      return [8 + r * 0.3, 10 + g * 0.36, 18 + b * 0.5];
    },
  },
  parchment: {
    flat: true,
    highGround: "hachures",
    ink: toHex(PARCHMENT_INK),
    paper: true,
    vignette: "#6b4a26",
    recolour: monochrome(PARCHMENT_INK, PARCHMENT_PAPER, [96, 124, 128], 0.08),
  },
  ink: {
    flat: true,
    highGround: "hachures",
    ink: toHex(INK_INK),
    recolour: monochrome(INK_INK, INK_PAPER, [150, 172, 196], 0.1, 1.45),
  },
  textbook: {
    flat: true,
    highGround: "contours",
    ink: "#8a5a2b",
    recolour: (rgb) => {
      const c = toHsl(rgb);
      const b = blueness(c);
      if (b > 0)
        return fromHsl({
          h: lerpHue(c.h, 204, 0.7 * b),
          s: 0.55,
          l: 0.5 + c.l * 0.38,
        });
      return fromHsl({
        h: c.h,
        s: Math.min(0.5, c.s * 1.2 + 0.05),
        l: 0.38 + c.l * 0.58,
      });
    },
  },
};

const recipe = (style: TerrainStyle = DEFAULT_TERRAIN_STYLE) =>
  RECIPES[style] ?? RECIPES.painted;

const PURE = new Set(["#fff", "#ffffff", "#000", "#000000"]);

// A colour in a style. Anything that isn't a hex colour (none, a pattern) is left alone.
export function styleColour(
  colour: string,
  style: TerrainStyle = DEFAULT_TERRAIN_STYLE
): string {
  if (style === "painted") return colour;
  const rgb = parseHex(colour);
  if (!rgb) return colour;
  const r = recipe(style);
  if (r.keepBlackWhite && PURE.has(colour.toLowerCase())) return colour;
  return toHex(r.recolour(rgb));
}

// The ground under everything, in a style
export const styleGround = (kind: BattleKind, style?: TerrainStyle) =>
  styleColour(GROUND_COLOUR[kind], style);

// Each style's patterns get names of their own (tp-autumn-field, ...), so two battles in
// different styles on one page don't borrow each other's
const patternName = (name: string, style: TerrainStyle) =>
  style === "painted" ? name : `${style}-${name}`;

// Strokes in a style: recoloured, their patterns swapped for the style's, and without the
// shading and shadows where the style is flat
export function styleStrokes(
  strokes: TerrainStroke[],
  style: TerrainStyle = DEFAULT_TERRAIN_STYLE
): TerrainStroke[] {
  if (style === "painted") return strokes;
  const r = recipe(style);
  return strokes
    .filter((s) => !(r.flat && s.shading))
    .map((s) => ({
      ...s,
      fill: s.fill?.startsWith("pattern:")
        ? `pattern:${patternName(s.fill.slice(8), style)}`
        : s.fill && styleColour(s.fill, style),
      stroke: s.stroke && styleColour(s.stroke, style),
    }));
}

// A style's patterns as SVG, for the <defs> of whatever draws terrain in it
export function stylePatterns(
  style: TerrainStyle = DEFAULT_TERRAIN_STYLE
): string {
  if (style === "painted") return TERRAIN_PATTERNS;
  const r = recipe(style);
  let defs = TERRAIN_PATTERNS.replace(/id="tp-/g, `id="tp-${style}-`).replace(
    /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi,
    (c) => styleColour(c, style)
  );
  if (r.paper && r.ink)
    defs +=
      `<pattern id="tp-${style}-paper" width="160" height="140" patternUnits="userSpaceOnUse">` +
      `<g fill="${r.ink}">` +
      `<circle cx="30" cy="40" r="22" opacity="0.035"/><circle cx="118" cy="22" r="14" opacity="0.03"/>` +
      `<circle cx="96" cy="104" r="28" opacity="0.03"/><circle cx="12" cy="118" r="10" opacity="0.04"/>` +
      `<circle cx="64" cy="76" r="1" opacity="0.18"/><circle cx="140" cy="70" r="0.8" opacity="0.16"/>` +
      `<circle cx="20" cy="88" r="0.7" opacity="0.16"/><circle cx="108" cy="132" r="0.9" opacity="0.14"/>` +
      `</g></pattern>`;
  if (r.vignette)
    defs +=
      `<radialGradient id="tp-${style}-vignette" cx="0.5" cy="0.5" r="0.72">` +
      `<stop offset="0.55" stop-color="${r.vignette}" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="${r.vignette}" stop-opacity="0.45"/></radialGradient>`;
  return defs;
}

// ---- What some styles draw on top ----

type P = PathPoint;

// A feature's outline with its holes, to keep strokes inside it
const areaClip = (feature: TerrainFeature) => ({
  clip: smoothPath(feature.points, true) + holesPath(feature),
  clipRule: "evenodd" as const,
});

// Short strokes running down the slope from each ring towards the next one in, as on old
// engraved maps: bolder on the side away from the light (the bottom right)
function hachures(feature: TerrainFeature, ink: string): TerrainStroke[] {
  const mountain = feature.kind === "mountain";
  const bands = mountain
    ? [
        [0.98, 0.76],
        [0.72, 0.5],
        [0.46, 0.24],
      ]
    : [
        [0.98, 0.72],
        [0.68, 0.44],
      ];
  const c = areaCentre(feature.points);
  let lit = "";
  let shaded = "";
  for (const [outer, inner] of bands) {
    const ring = sampleCurve(
      shrink(feature.points, outer),
      true,
      mountain ? 4 : 5
    );
    const k = inner / outer;
    for (const p of ring) {
      const q = { x: c.x + (p.x - c.x) * k, y: c.y + (p.y - c.y) * k };
      const d = `M${p.x.toFixed(1)} ${p.y.toFixed(1)}L${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
      // facing the bottom right, away from the light
      if (p.x - c.x + (p.y - c.y) > 0) shaded += d;
      else lit += d;
    }
  }
  const clip = areaClip(feature);
  return [
    { d: lit, stroke: ink, width: 0.8, opacity: 0.4, cap: "butt", ...clip },
    { d: shaded, stroke: ink, width: 1.4, opacity: 0.65, cap: "butt", ...clip },
  ];
}

// A run moved sideways by `distance` (to its right, on screen)
function offsetRun(run: P[], distance: number): P[] {
  return run.map((p, i) => {
    const a = run[Math.max(i - 1, 0)];
    const b = run[Math.min(i + 1, run.length - 1)];
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return {
      x: p.x - ((b.y - a.y) / length) * distance,
      y: p.y + ((b.x - a.x) / length) * distance,
    };
  });
}

// Hachures down both sides of a ridge's crest
function ridgeHachures(feature: TerrainFeature, ink: string): TerrainStroke[] {
  const run = sampleCurve(feature.points, false, 2);
  let lit = "";
  let shaded = "";
  for (const { x, y, dx, dy } of alongLine(run, 4.5)) {
    const nx = -dy;
    const ny = dx;
    for (const side of [1, -1]) {
      const d =
        `M${(x + nx * 4 * side).toFixed(1)} ${(y + ny * 4 * side).toFixed(1)}` +
        `L${(x + nx * 21 * side).toFixed(1)} ${(y + ny * 21 * side).toFixed(1)}`;
      if ((nx + ny) * side > 0) shaded += d;
      else lit += d;
    }
  }
  return [
    { d: lit, stroke: ink, width: 0.9, opacity: 0.5, cap: "butt" },
    { d: shaded, stroke: ink, width: 1.5, opacity: 0.75, cap: "butt" },
  ];
}

// Contour lines: rings of equal height, closer together on a mountain, and a mark on the top
function contours(feature: TerrainFeature, ink: string): TerrainStroke[] {
  const mountain = feature.kind === "mountain";
  const rings = mountain ? [0.84, 0.68, 0.52, 0.36, 0.2] : [0.78, 0.56, 0.34];
  const d = rings
    .map((f) => smoothPath(shrink(feature.points, f), true))
    .join("");
  const c = areaCentre(feature.points);
  const s = mountain ? 6 : 4.5;
  return [
    { d, stroke: ink, width: 1.3, opacity: 0.8, ...areaClip(feature) },
    {
      d: `M${c.x} ${c.y - s}L${c.x + s} ${c.y + s * 0.7}L${c.x - s} ${c.y + s * 0.7}Z`,
      fill: ink,
    },
  ];
}

// A ridge's contours: loops round its crest
function ridgeContours(feature: TerrainFeature, ink: string): TerrainStroke[] {
  const run = sampleCurve(feature.points, false, 4);
  const loop = (half: number) =>
    polylinePath(
      [...offsetRun(run, half), ...offsetRun(run, -half).reverse()],
      true
    );
  return [{ d: loop(17) + loop(8), stroke: ink, width: 1.2, opacity: 0.8 }];
}

// What a style draws over the whole battleground: hachures or contours on high ground, paper
// grain and dark edges over everything
export function styleOverlay(
  features: TerrainFeature[],
  width: number,
  height: number,
  style: TerrainStyle = DEFAULT_TERRAIN_STYLE
): TerrainStroke[] {
  const r = recipe(style);
  const out: TerrainStroke[] = [];
  if (r.highGround && r.ink) {
    const ink = r.ink;
    for (const f of features) {
      if (f.kind === "hill" || f.kind === "mountain") {
        if (f.points.length < 3) continue;
        out.push(
          ...(r.highGround === "hachures" ? hachures(f, ink) : contours(f, ink))
        );
      } else if (f.kind === "ridge" && f.points.length >= 2) {
        out.push(
          ...(r.highGround === "hachures"
            ? ridgeHachures(f, ink)
            : ridgeContours(f, ink))
        );
      }
    }
  }
  const all = `M0 0H${width}V${height}H0Z`;
  if (r.paper) out.push({ d: all, fill: `pattern:${style}-paper` });
  if (r.vignette) out.push({ d: all, fill: `pattern:${style}-vignette` });
  return out;
}

// ---- The picture each style is shown with in the picker ----

// A little battlefield with a bit of everything: a hill half under a wood, a river under a
// road's bridge running into a lake, a field and a village, STYLE_SAMPLE_WIDTH by
// STYLE_SAMPLE_HEIGHT map units
export const STYLE_SAMPLE_WIDTH = 640;
export const STYLE_SAMPLE_HEIGHT = 248;

// Laid out at half size, then doubled
const SAMPLE_LAYOUT: TerrainFeature[] = [
  {
    id: "sample-lake",
    kind: "lake",
    points: [
      { x: 250, y: 70 },
      { x: 300, y: 64 },
      { x: 334, y: 90 },
      { x: 330, y: 134 },
      { x: 240, y: 134 },
      { x: 226, y: 100 },
    ],
  },
  {
    id: "sample-field",
    kind: "field",
    points: [
      { x: -10, y: 82 },
      { x: 60, y: 76 },
      { x: 92, y: 104 },
      { x: 70, y: 134 },
      { x: -10, y: 134 },
    ],
  },
  {
    id: "sample-hill",
    kind: "hill",
    points: [
      { x: 40, y: 8 },
      { x: 110, y: -4 },
      { x: 170, y: 20 },
      { x: 160, y: 62 },
      { x: 92, y: 74 },
      { x: 30, y: 52 },
    ],
  },
  {
    id: "sample-forest",
    kind: "forest",
    points: [
      { x: 120, y: 14 },
      { x: 176, y: 8 },
      { x: 214, y: 30 },
      { x: 196, y: 64 },
      { x: 140, y: 60 },
    ],
  },
  {
    id: "sample-town",
    kind: "town",
    points: [
      { x: 132, y: 92 },
      { x: 190, y: 86 },
      { x: 212, y: 112 },
      { x: 180, y: 134 },
      { x: 124, y: 128 },
    ],
  },
  {
    id: "sample-river",
    kind: "river",
    points: [
      { x: 238, y: -10 },
      { x: 222, y: 40 },
      { x: 262, y: 90 },
    ],
  },
  {
    id: "sample-road",
    kind: "road",
    points: [
      { x: -10, y: 70 },
      { x: 120, y: 80 },
      { x: 330, y: 50 },
    ],
  },
];

export const STYLE_SAMPLE: TerrainFeature[] = SAMPLE_LAYOUT.map((f) => ({
  ...f,
  points: f.points.map((p) => ({ x: p.x * 2, y: p.y * 2 })),
}));
