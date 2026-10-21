// Terrain: scattered items (trees, peaks, rocks, houses) and where they go

import { PathPoint } from "../../types";
import { circlePath, pt, round } from "./shapes";
import type { TerrainStroke } from "./looks";
import { courtyard, house } from "./buildings";

// Whether a point is inside a closed outline of short straight steps
export function inPolygon(p: PathPoint, poly: PathPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

// The edge of a circle, as eight points, to check a whole item fits somewhere
export const ringPoints = (x: number, y: number, r: number): PathPoint[] =>
  Array.from({ length: 8 }, (_, i) => ({
    x: x + Math.cos((i * Math.PI) / 4) * r,
    y: y + Math.sin((i * Math.PI) / 4) * r,
  }));

// Where an area's items may go. Each item is a circle of radius r around its middle, and is
// drawn whole or not at all.
export interface ScatterContext {
  fits?: (x: number, y: number, r: number) => boolean; // the whole item is inside the area
  owns?: (x: number, y: number) => boolean; // this feature, not an overlapping one, draws it
  blocked?: (x: number, y: number, r: number) => boolean; // a road, river or wall is in the way
  snowy?: (x: number, y: number) => boolean; // under snow
  height?: (x: number, y: number) => number; // how high the ground is: 0 flat, 1 a hilltop
  placed?: (x: number, y: number, r: number) => void; // told of each item as it's placed
}

// A random number source that's always the same for one spot of one kind, so a forest looks
// the same every time it's drawn, keeps its trees as it's reshaped, and overlapping forests
// agree on where their trees are
export function cellRandom(kind: string, ix: number, iy: number): () => number {
  let h = 2166136261;
  const key = `${kind}:${ix}:${iy}`;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(list: T[], r: number) =>
  list[Math.min(list.length - 1, Math.floor(r * list.length))];

// One item: how big it is (for fitting), its pieces, each in one of the kind's styles, and how
// high the ground is under it (higher items are drawn over lower ones)
export interface Item {
  r: number;
  parts: { style: string; d: string }[];
  level?: number;
  outline?: PathPoint[]; // a building's corners: buildings never overlap each other
}

// What an item is made for: under snow, and how much bigger it's drawn for standing higher
// (closer to the camera)
export interface ItemOptions {
  snowy: boolean;
  scale: number;
}

interface ScatterKind {
  cell: number; // about how far apart items are
  jitter: number; // how far from the grid they wander, as a share of the cell
  chance: number; // how many of the cells get an item
  stagger?: boolean; // every other row shifted by half a cell
  styles: Record<string, Omit<TerrainStroke, "d">>;
  order: string[]; // the styles, bottom to top
  make: (x: number, y: number, rand: () => number, o: ItemOptions) => Item;
}

// Snow lying on things: on tree crowns, roofs and rocks
const SNOW_STYLE = { fill: "#f4f7f9", opacity: 0.9 };

// A round crown of leaves, with snow on its top when under snow
function crown(
  x: number,
  y: number,
  r: number,
  style: string,
  snowy: boolean
): Item {
  const parts = [{ style, d: circlePath(x, y, r) }];
  if (snowy)
    parts.push({
      style: "snow",
      d: circlePath(x - r * 0.22, y - r * 0.28, r * 0.58),
    });
  return { r, parts };
}

// Roofs lit from the top left: each has a lit half and a shaded half either side of its ridge
const ROOF_LIT = ["#b8704f", "#ac6650", "#bb7655", "#a45f47"];
const ROOF_DARK = ["#8a4c37", "#7f4734", "#905239", "#76432f"];
const ROOF_STYLES: Record<string, Omit<TerrainStroke, "d">> = {
  yard: { fill: "#b8ab88", opacity: 0.7 },
  yardSnow: { fill: "#e9eef1" },
  ...Object.fromEntries(ROOF_LIT.map((fill, i) => [`r${i}`, { fill }])),
  ...Object.fromEntries(ROOF_DARK.map((fill, i) => [`r${i}s`, { fill }])),
  snow: { fill: "#f3f6f8" },
  snowS: { fill: "#d3dbe0" },
  stone: { fill: "#9a958b" },
  stoneS: { fill: "#7c776e" },
  edge: { stroke: "#5e3d2b", width: 1.1 },
  stoneEdge: { stroke: "#4f4a42", width: 1.3 },
  snowEdge: { stroke: "#8d8a86", width: 1.1 },
  chimney: { fill: "#6b5a4a" },
  tower: { fill: "#a39d92", stroke: "#4f4a42", width: 1.3 },
  towerRoof: { stroke: "#4f4a42", width: 1 },
};
const ROOF_ORDER = [
  "yard",
  "yardSnow",
  "r0",
  "r1",
  "r2",
  "r3",
  "r0s",
  "r1s",
  "r2s",
  "r3s",
  "stone",
  "stoneS",
  "snow",
  "snowS",
  "edge",
  "stoneEdge",
  "snowEdge",
  "chimney",
  "tower",
  "towerRoof",
];

export const SCATTER: Record<string, ScatterKind> = {
  forest: {
    cell: 17,
    jitter: 0.9,
    chance: 0.95,
    styles: {
      a: { fill: "#3f6b25", stroke: "#34591f", width: 1.4 },
      b: { fill: "#46742a", stroke: "#34591f", width: 1.4 },
      c: { fill: "#386021", stroke: "#2f521b", width: 1.4 },
      snow: SNOW_STYLE,
    },
    order: ["a", "b", "c", "snow"],
    make: (x, y, rand, o) =>
      crown(
        x,
        y,
        (7.5 + rand() * 4) * o.scale,
        pick(["a", "b", "c"], rand()),
        o.snowy
      ),
  },
  pines: {
    cell: 15,
    jitter: 0.8,
    chance: 0.92,
    styles: {
      trunk: { stroke: "#5a4026", width: 2, cap: "butt" },
      a: { fill: "#2f5a26", stroke: "#264a1f", width: 1 },
      b: { fill: "#356428", stroke: "#264a1f", width: 1 },
      snow: SNOW_STYLE,
    },
    order: ["trunk", "a", "b", "snow"],
    make: (x, y, rand, o) => {
      const s = (0.8 + rand() * 0.45) * o.scale;
      const h = 17 * s;
      const w = 13 * s;
      const top = y - h * 0.6;
      const parts = [
        { style: "trunk", d: `M${pt(x, y + h * 0.35)}v${round(h * 0.2)}` },
        {
          style: pick(["a", "b"], rand()),
          d: `M${pt(x, top)}L${pt(x + w / 2, y + h * 0.4)}L${pt(x - w / 2, y + h * 0.4)}Z`,
        },
      ];
      // snow down the top half of the tree, with a ragged edge
      if (o.snowy)
        parts.push({
          style: "snow",
          d:
            `M${pt(x, top)}L${pt(x + w * 0.27, top + h * 0.5)}L${pt(x + w * 0.1, top + h * 0.44)}` +
            `L${pt(x, top + h * 0.52)}L${pt(x - w * 0.12, top + h * 0.45)}L${pt(x - w * 0.27, top + h * 0.5)}Z`,
        });
      return { r: h * 0.6, parts };
    },
  },
  orchard: {
    cell: 26,
    jitter: 0.06,
    chance: 1,
    styles: {
      a: { fill: "#577a33", stroke: "#466528", width: 1.5 },
      b: { fill: "#5e8338", stroke: "#466528", width: 1.5 },
      snow: SNOW_STYLE,
    },
    order: ["a", "b", "snow"],
    make: (x, y, rand, o) =>
      crown(
        x,
        y,
        (6 + rand() * 1.6) * o.scale,
        pick(["a", "b"], rand()),
        o.snowy
      ),
  },
  scrub: {
    cell: 19,
    jitter: 0.8,
    chance: 0.75,
    styles: {
      a: { fill: "#6f8a45" },
      b: { fill: "#677f40" },
      snow: SNOW_STYLE,
    },
    order: ["a", "b", "snow"],
    make: (x, y, rand, o) => {
      const style = pick(["a", "b"], rand());
      const count = 2 + Math.floor(rand() * 2);
      let d = "";
      let snow = "";
      for (let i = 0; i < count; i++) {
        const bx = x + (rand() - 0.5) * 7 * o.scale;
        const by = y + (rand() - 0.5) * 6 * o.scale;
        const br = (2.8 + rand() * 1.5) * o.scale;
        d += circlePath(bx, by, br);
        if (o.snowy)
          snow += circlePath(bx - br * 0.2, by - br * 0.25, br * 0.55);
      }
      const parts = [{ style, d }];
      if (snow) parts.push({ style: "snow", d: snow });
      return { r: 8 * o.scale, parts };
    },
  },
  rocks: {
    cell: 17,
    jitter: 0.8,
    chance: 0.7,
    styles: {
      a: { fill: "#8b897e", stroke: "#6f6d63", width: 1 },
      b: { fill: "#98958a", stroke: "#6f6d63", width: 1 },
      snow: SNOW_STYLE,
    },
    order: ["a", "b", "snow"],
    make: (x, y, rand, o) => {
      const sides = 5 + Math.floor(rand() * 2);
      const size = (4 + rand() * 3.5) * o.scale;
      let d = "";
      for (let i = 0; i < sides; i++) {
        const a = ((i + rand() * 0.5) / sides) * Math.PI * 2;
        const r = size * (0.7 + rand() * 0.3);
        d += `${i === 0 ? "M" : "L"}${pt(x + Math.cos(a) * r, y + Math.sin(a) * r)}`;
      }
      const parts = [{ style: pick(["a", "b"], rand()), d: `${d}Z` }];
      if (o.snowy)
        parts.push({
          style: "snow",
          d: circlePath(x - size * 0.15, y - size * 0.3, size * 0.45),
        });
      return { r: size, parts };
    },
  },
  mountain: {
    cell: 32,
    jitter: 0.45,
    chance: 0.9,
    stagger: true,
    styles: {
      a: { fill: "#8f8674", stroke: "#6a6252", width: 1.4 },
      b: { fill: "#968d7a", stroke: "#6a6252", width: 1.4 },
      c: { fill: "#8a8170", stroke: "#6a6252", width: 1.4 },
      shade: { fill: "#000", opacity: 0.13 },
      cap: { fill: "#f3f1ea", stroke: "#d9dcdc", width: 0.8 },
    },
    order: ["a", "b", "c", "shade", "cap"],
    make: (x, y, rand, o) => {
      const s = 0.8 + rand() * 0.45;
      const w = 27 * s;
      const h = 23 * s;
      const top = y - h / 2;
      const foot = y + h / 2;
      // the snow line: a little way down, or most of the way under snow
      const c = o.snowy ? 0.55 : 0.28 + rand() * 0.08;
      const capY = top + h * c;
      const capX = (w / 2) * c;
      return {
        r: Math.max(w, h) / 2,
        parts: [
          {
            style: pick(["a", "b", "c"], rand()),
            d: `M${pt(x - w / 2, foot)}L${pt(x, top)}L${pt(x + w / 2, foot)}Z`,
          },
          // the side away from the light
          {
            style: "shade",
            d: `M${pt(x, top)}L${pt(x + w / 2, foot)}L${pt(x + w * 0.08, foot)}Z`,
          },
          {
            style: "cap",
            d:
              `M${pt(x, top)}L${pt(x + capX, capY)}L${pt(x + capX / 2, capY - 2)}` +
              `L${pt(x, capY)}L${pt(x - capX / 2, capY - 2)}L${pt(x - capX, capY)}Z`,
          },
        ],
      };
    },
  },
  marsh: {
    cell: 20,
    jitter: 0.8,
    chance: 0.8,
    styles: { a: { stroke: "#5f7f66", width: 1.8 } },
    order: ["a"],
    make: (x, y, rand, o) => {
      const s = (0.8 + rand() * 0.4) * o.scale;
      return {
        r: 7 * s,
        parts: [
          {
            style: "a",
            d:
              `M${pt(x - 6 * s, y)}h${round(12 * s)}` +
              `M${pt(x, y)}l${round(-3 * s)} ${round(-6 * s)}` +
              `M${pt(x, y)}v${round(-7 * s)}` +
              `M${pt(x, y)}l${round(3 * s)} ${round(-6 * s)}`,
          },
        ],
      };
    },
  },
  town: {
    cell: 21,
    jitter: 0.35,
    chance: 0.9,
    styles: ROOF_STYLES,
    order: ROOF_ORDER,
    make: (x, y, rand, o) =>
      house(
        x,
        y,
        (11 + rand() * 6) * o.scale,
        (8 + rand() * 4) * o.scale,
        (rand() - 0.5) * 0.35,
        rand(),
        o.snowy,
        rand() < 0.6
      ),
  },
  // Old-town blocks: buildings round a courtyard, closed or open on a side or two
  courtyard: {
    cell: 72,
    jitter: 0.5,
    chance: 0.35,
    styles: ROOF_STYLES,
    order: ROOF_ORDER,
    make: (x, y, rand, o) =>
      courtyard(
        x,
        y,
        36 + rand() * 12,
        32 + rand() * 12,
        (rand() - 0.5) * 0.3,
        rand(),
        o.snowy
      ),
  },
};
SCATTER.walled = SCATTER.town;
