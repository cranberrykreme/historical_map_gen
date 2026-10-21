// Terrain styles: how each style recolours the terrain

import { BattleKind, TerrainStyle } from "../../types";
import { GROUND_COLOUR, TERRAIN_PATTERNS, TerrainStroke } from "./terrain";
import { DEFAULT_TERRAIN_STYLE } from "./styleList";

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

export const recipe = (style: TerrainStyle = DEFAULT_TERRAIN_STYLE) =>
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
