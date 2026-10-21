// Terrain: drawing order, SVG patterns and feature labels

import { TerrainFeature, TerrainKind } from "../../types";
import { TERRAIN_KINDS, kindInfo } from "./kinds";
import type { TerrainStroke } from "./looks";

const LAYER: Record<TerrainKind, number> = Object.fromEntries(
  TERRAIN_KINDS.map((k, i) => [k.kind, i])
) as Record<TerrainKind, number>;

// The features in the order they're drawn: by kind (see TERRAIN_KINDS), and within a kind in
// the order they were drawn
export function sortedFeatures(features: TerrainFeature[]): TerrainFeature[] {
  return features
    .map((feature, index) => ({ feature, index }))
    .sort(
      (a, b) =>
        LAYER[a.feature.kind] - LAYER[b.feature.kind] || a.index - b.index
    )
    .map(({ feature }) => feature);
}

// The patterns some kinds are filled with, as SVG, to go in the <defs> of whatever draws the
// terrain (the editor's layer, and the renderer's picture of the battleground)
export const TERRAIN_PATTERNS = [
  // Hill shading: lit from the top left, in shadow to the bottom right, across each shape
  `<linearGradient id="tp-shade" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#fff" stop-opacity="0.55"/>` +
    `<stop offset="0.5" stop-color="#fff" stop-opacity="0"/>` +
    `<stop offset="0.5" stop-color="#000" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="0.5"/></linearGradient>`,
  // Ice: faint cracks over frozen water
  `<pattern id="tp-ice" width="90" height="70" patternUnits="userSpaceOnUse">` +
    `<path d="M4 20l22 6 14-10 18 8M40 16l6 22-10 18M58 24l24 4M20 52l18 4 22-6 26 8" ` +
    `stroke="#a9c8d8" stroke-width="1.2" fill="none" stroke-linecap="round"/></pattern>`,
  `<pattern id="tp-field" width="18" height="18" patternUnits="userSpaceOnUse">` +
    `<path d="M0 18L18 0M-4 4L4 -4M14 22L22 14" stroke="#a9a55e" stroke-width="2"/></pattern>`,
  `<pattern id="tp-sand" width="22" height="22" patternUnits="userSpaceOnUse">` +
    `<g fill="#c8b47a"><circle cx="4" cy="5" r="1.4"/><circle cx="15" cy="9" r="1.2"/>` +
    `<circle cx="9" cy="17" r="1.3"/><circle cx="19" cy="19" r="1"/></g></pattern>`,
  `<pattern id="tp-snow" width="36" height="28" patternUnits="userSpaceOnUse">` +
    `<path d="M4 8q6 -4 12 0M20 20q6 -4 12 0" stroke="#c3d3de" stroke-width="2" fill="none" stroke-linecap="round"/></pattern>`,
  `<pattern id="tp-waves" width="48" height="30" patternUnits="userSpaceOnUse">` +
    `<path d="M4 10q5 -5 10 0t10 0M26 24q5 -5 10 0t10 0" stroke="#5f8bb5" stroke-width="2" fill="none" stroke-linecap="round"/></pattern>`,
  `<pattern id="tp-reef" width="30" height="26" patternUnits="userSpaceOnUse">` +
    `<g fill="#5f7d7a"><circle cx="6" cy="6" r="2.5"/><circle cx="10" cy="9" r="1.8"/>` +
    `<circle cx="21" cy="18" r="2.6"/><circle cx="25" cy="15" r="1.6"/></g></pattern>`,
].join("");

// A fill as SVG: a colour, or a pattern from TERRAIN_PATTERNS
export const svgFill = (fill: string | undefined) =>
  !fill
    ? "none"
    : fill.startsWith("pattern:")
      ? `url(#tp-${fill.slice(8)})`
      : fill;

const escape = (value: string) => value.replace(/"/g, "&quot;");

// The strokes as SVG elements. A stroke drawn inside a shape gets a clip path, named from
// `prefix` so that two drawings on one page don't share names.
export function strokesSvg(strokes: TerrainStroke[], prefix = "tc"): string {
  return strokes
    .map((s, i) => {
      const path =
        `<path d="${escape(s.d)}" fill="${svgFill(s.fill)}"` +
        (s.fillRule ? ` fill-rule="${s.fillRule}"` : "") +
        (s.stroke
          ? ` stroke="${s.stroke}" stroke-width="${s.width ?? 1}" stroke-linecap="${s.cap ?? "round"}" stroke-linejoin="round"`
          : "") +
        (s.dash ? ` stroke-dasharray="${s.dash}"` : "") +
        (s.opacity !== undefined ? ` opacity="${s.opacity}"` : "") +
        `/>`;
      if (!s.clip) return path;
      const id = `${prefix}${i}`;
      const shapes = (Array.isArray(s.clip) ? s.clip : [s.clip])
        .map(
          (d) =>
            `<path d="${escape(d)}"${s.clipRule ? ` clip-rule="${s.clipRule}"` : ""}/>`
        )
        .join("");
      return (
        `<clipPath id="${id}">${shapes}</clipPath>` +
        `<g clip-path="url(#${id})">${path}</g>`
      );
    })
    .join("");
}

// The names of a battle's features in the list: their own name, or "Hill 1", "Hill 2", ... in
// the order they were drawn
export function featureLabels(features: TerrainFeature[]): Map<string, string> {
  const labels = new Map<string, string>();
  const counts = new Map<TerrainKind, number>();
  for (const f of features) {
    const n = (counts.get(f.kind) ?? 0) + 1;
    counts.set(f.kind, n);
    labels.set(f.id, f.name?.trim() || `${kindInfo(f.kind).label} ${n}`);
  }
  return labels;
}
