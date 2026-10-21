// Terrain: how each kind looks (fills, edges, rivers and other lines)

import { PathPoint, TerrainFeature, TerrainKind } from "../../types";
import { isLine } from "./kinds";
import {
  circlePath,
  dots,
  polylinePath,
  ribbon,
  runLength,
  sampleCurve,
  shrink,
  smoothPath,
  teeth,
  ticks,
} from "./shapes";
import type { ScatterContext } from "./scatter";
import { scatterItems } from "./items";

// One layer of a feature's drawing. Each feature is a few of these, drawn in order.
export interface TerrainStroke {
  d: string;
  fill?: string; // a colour, or a pattern by name: "pattern:sand"
  stroke?: string;
  width?: number;
  opacity?: number;
  dash?: string; // an SVG dash pattern, e.g. "8 4"
  cap?: "round" | "butt";
  // Only drawn inside this closed shape (SVG path data), or inside any of these shapes
  clip?: string | string[];
  clipRule?: "evenodd"; // a clip shape with holes cut in it
  fillRule?: "evenodd"; // a shape with holes cut in it
  shading?: boolean; // light and shadow on high ground, left out by flat styles
}

const PATTERN = (name: string) => `pattern:${name}`;

// An area's holes as SVG path data, to add to its outline: drawn with the even-odd rule, they
// cut through the shape
export const holesPath = (feature: TerrainFeature) =>
  (feature.holes ?? []).map((hole) => smoothPath(hole, true)).join("");

// A feature's whole shape as SVG path data: an area's edge and its holes, or a line
export const featurePath = (feature: TerrainFeature) =>
  isLine(feature.kind)
    ? smoothPath(feature.points, false)
    : smoothPath(feature.points, true) + holesPath(feature);

// The drawing of one feature on its own, bottom to top: its shape, then the trees, peaks or
// houses scattered over it (a battleground also has the ways features meet: see terrainScene)
export function featureStrokes(
  feature: TerrainFeature,
  scatter?: ScatterContext
): TerrainStroke[] {
  return [...baseStrokes(feature), ...scatterItems(feature, scatter)];
}

// A feature's shape: its fill and edge, a hill's rings, a texture; no scattered items
export function baseStrokes(feature: TerrainFeature): TerrainStroke[] {
  if (isLine(feature.kind))
    return lineStrokes(feature.kind, [
      { run: sampleCurve(feature.points, false, 4) },
    ]);
  const strokes = areaStrokes(feature);
  // with holes, every layer has them cut through it
  return feature.holes?.length
    ? strokes.map((s) => ({ ...s, fillRule: "evenodd" as const }))
    : strokes;
}

function areaStrokes(feature: TerrainFeature): TerrainStroke[] {
  const { points } = feature;
  const holes = holesPath(feature);
  const area = (pts: PathPoint[] = points) => smoothPath(pts, true) + holes;
  switch (feature.kind) {
    // water
    case "deep":
      return [
        { d: area(), fill: "#33608a", stroke: "#2b5379", width: 3 },
        { d: area(), fill: PATTERN("waves") },
      ];
    case "shallows":
      return [{ d: area(), fill: "#7fb6d9", stroke: "#a3cde6", width: 8 }];
    case "lake":
      return [
        { d: area(), fill: "#5b9bd5", stroke: "#3f7fb8", width: 3 },
        {
          d: area(shrink(points, 0.86)),
          stroke: "#8cc0e8",
          width: 4,
          opacity: 0.6,
        },
      ];
    case "reef":
      return [
        {
          d: area(),
          fill: "#8fc4c9",
          stroke: "#b8dde0",
          width: 4,
          opacity: 0.9,
        },
        { d: area(), fill: PATTERN("reef") },
      ];
    // ground
    case "land":
      return [{ d: area(), fill: "#9cb56e", stroke: "#d8c690", width: 16 }];
    case "sand":
      return [
        { d: area(), fill: "#e3d29b", stroke: "#cdbb83", width: 2 },
        { d: area(), fill: PATTERN("sand") },
      ];
    case "field":
      return [
        { d: area(), fill: "#c5c27a", stroke: "#a9a55e", width: 2 },
        { d: area(), fill: PATTERN("field") },
      ];
    case "scrub":
      return [{ d: area(), fill: "#9fae6a", stroke: "#889759", width: 2 }];
    case "marsh":
      return [{ d: area(), fill: "#7d9b7a", stroke: "#66845f", width: 2 }];
    case "snow":
      return [
        { d: area(), fill: "#eef3f6", stroke: "#c9d6df", width: 3 },
        { d: area(), fill: PATTERN("snow") },
      ];
    // high ground
    case "rocks":
      return [{ d: area(), fill: "#a7a59a", stroke: "#8a887d", width: 2 }];
    case "hill":
      return [
        { d: area(), fill: "#b9b27a", stroke: "#9d955f", width: 2 },
        { d: area(shrink(points, 0.68)), fill: "#c9bf86" },
        { d: area(shrink(points, 0.38)), fill: "#d8cc96" },
      ];
    case "mountain":
      return [
        { d: area(), fill: "#a39a86", stroke: "#7c7362", width: 3 },
        { d: area(shrink(points, 0.6)), fill: "#b3aa96" },
      ];
    // woods and settlements
    case "forest":
      return [{ d: area(), fill: "#5f8a3c", stroke: "#4a7030", width: 3 }];
    case "pines":
      return [{ d: area(), fill: "#4f7a3a", stroke: "#3d6230", width: 3 }];
    case "orchard":
      return [{ d: area(), fill: "#a4b86c", stroke: "#86994f", width: 2 }];
    case "town":
    case "walled":
      return [{ d: area(), fill: "#cbbf9f", stroke: "#9e8c70", width: 3 }];
    default:
      return [];
  }
}

// The widths of the water in rivers and streams: the bank, and the water inside it
export const RIVER_WIDTH: Partial<Record<TerrainKind, [number, number]>> = {
  river: [24, 14],
  stream: [10, 4],
};

// How wide each line kind is drawn, for lanes cut through woods and gaps in walls
export const LINE_WIDTH: Partial<Record<TerrainKind, number>> = {
  river: 24,
  stream: 10,
  ditch: 9,
  road: 14,
  bridge: 24,
  ridge: 46,
  cliff: 18,
  wall: 11,
  palisade: 9,
};

// How a river ends: narrowing to a trickle (its source), widening into the water it runs into
// (its mouth), or plain and round
export type RiverEnd = "taper" | "flare" | "round";

// One stretch of a line kind to draw, as a run of short straight steps, and how a river ends
// at each end of it
export interface LineRun {
  run: PathPoint[];
  start?: RiverEnd;
  end?: RiverEnd;
}

// A river or stream's water along a run: a band whose width changes towards a source or a
// mouth, with round ends where neither
function riverBand(
  { run, start = "round", end = "round" }: LineRun,
  width: number
): string {
  const length = runLength(run);
  const both = start !== "round" && end !== "round";
  const taper = Math.max(1, Math.min(width * 5, length / (both ? 2 : 1.2)));
  const flare = Math.max(1, Math.min(width * 2.5, length / (both ? 2 : 1.5)));
  const at = (along: number) => {
    let f = 1;
    const ends: [RiverEnd, number][] = [
      [start, along],
      [end, length - along],
    ];
    for (const [kind, from] of ends) {
      if (kind === "taper")
        f = Math.min(f, 0.12 + 0.88 * Math.min(1, Math.max(0, from / taper)));
      if (kind === "flare" && from < flare) {
        const t = 1 - from / flare;
        f *= 1 + 0.6 * t * t;
      }
    }
    return width * f;
  };
  let d = ribbon(run, at);
  const first = run[0];
  const last = run[run.length - 1];
  if (start === "round") d += circlePath(first.x, first.y, width / 2);
  if (end === "round") d += circlePath(last.x, last.y, width / 2);
  return d;
}

// How a line kind looks along some runs, bottom to top
export function lineStrokes(
  kind: TerrainKind,
  runs: LineRun[]
): TerrainStroke[] {
  const all = runs.filter((r) => r.run.length >= 2);
  if (all.length === 0) return [];
  const d = all.map((r) => polylinePath(r.run)).join("");
  const each = (draw: (run: PathPoint[]) => string) =>
    all.map((r) => draw(r.run)).join("");
  switch (kind) {
    case "river":
    case "stream": {
      const [bank, water] = RIVER_WIDTH[kind]!;
      const colours =
        kind === "river" ? ["#3f7fb8", "#6fa6db"] : ["#4f8cc6", "#7fb2e0"];
      const shaped = all.some(
        (r) =>
          (r.start ?? "round") !== "round" || (r.end ?? "round") !== "round"
      );
      if (!shaped)
        return [
          { d, stroke: colours[0], width: bank },
          { d, stroke: colours[1], width: water },
        ];
      return [
        { d: all.map((r) => riverBand(r, bank)).join(""), fill: colours[0] },
        { d: all.map((r) => riverBand(r, water)).join(""), fill: colours[1] },
      ];
    }
    case "ditch":
      return [
        { d, stroke: "#6b5a3e", width: 9 },
        { d, stroke: "#4c3f2b", width: 3 },
      ];
    case "road":
      return [
        { d, stroke: "#8a7650", width: 14 },
        { d, stroke: "#cdb88f", width: 10 },
      ];
    case "bridge":
      return [
        { d, stroke: "#5a4026", width: 24, cap: "butt" },
        { d, stroke: "#a0784a", width: 18, cap: "butt" },
        {
          d: each((r) => ticks(r, 6, 18, 0)),
          stroke: "#7d5a35",
          width: 1.5,
          cap: "butt",
        },
      ];
    // A long, narrow hill, shaded like a hill rising to its crest
    case "ridge":
      return [
        { d, stroke: "#b9b27a", width: 46 },
        { d, stroke: "#c9bf86", width: 28 },
        { d, stroke: "#d8cc96", width: 10 },
      ];
    // A rock face: a dark edge with rocky teeth hanging down the drop, on the right of the
    // direction drawn
    case "cliff":
      return [
        { d: each((r) => teeth(r, 11, 10, 18)), fill: "#7a705f" },
        { d: each((r) => teeth(r, 11, 6, 11)), fill: "#958a76" },
        { d, stroke: "#4a4338", width: 5 },
      ];
    case "wall":
      return [
        { d, stroke: "#6f6a5f", width: 11, cap: "butt" },
        { d, stroke: "#b5afa3", width: 7, dash: "9 3", cap: "butt" },
      ];
    // A fence of wooden stakes: a rail with the stakes' round tops along it
    case "palisade":
      return [
        { d, stroke: "#4f3620", width: 6 },
        {
          d: each((r) => dots(r, 9, 4.5)),
          fill: "#9a6c3c",
          stroke: "#4f3620",
          width: 1.5,
        },
      ];
    default:
      return [];
  }
}
