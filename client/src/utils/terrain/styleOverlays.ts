// Terrain styles: what some styles draw on top (hachures, contours, paper grain)

import { PathPoint, TerrainFeature, TerrainStyle } from "../../types";
import {
  TerrainStroke,
  alongLine,
  areaCentre,
  holesPath,
  polylinePath,
  sampleCurve,
  shrink,
  smoothPath,
} from "./terrain";
import { DEFAULT_TERRAIN_STYLE } from "./styleList";
import { recipe } from "./styleColours";

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
