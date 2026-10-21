// Terrain: placing scattered items and turning them into strokes

import { PathPoint, TerrainFeature } from "../../types";
import { sampleCurve } from "./shapes";
import type { TerrainStroke } from "./looks";
import { SCATTER, cellRandom, inPolygon, ringPoints } from "./scatter";
import type { Item, ScatterContext } from "./scatter";
import { rectsOverlap } from "./buildings";

// How many steps of height items are sorted into, so higher ones are drawn over lower ones
const LEVELS = 6;

// Pieces of items, merged into one stroke per style and height, bottom to top: everything on
// low ground first, then each step higher. `key` is the kind of item (a terrain kind, or
// "courtyard").
export function itemStrokes(key: string, items: Item[]): TerrainStroke[] {
  const spec = SCATTER[key];
  if (!spec) return [];
  const out: TerrainStroke[] = [];
  for (let level = 0; level < LEVELS; level++) {
    const here = items.filter((item) => (item.level ?? 0) === level);
    if (here.length === 0) continue;
    for (const style of spec.order) {
      const d = here
        .map((item) =>
          item.parts
            .filter((p) => p.style === style)
            .map((p) => p.d)
            .join("")
        )
        .join("");
      if (d) out.push({ ...spec.styles[style], d });
    }
  }
  return out;
}

// The trees, peaks, rocks or houses over an area: one to a spot on a loose grid, a little
// different in size and colour each, and only where the whole item fits. On high ground they're
// a little bigger (nearer the camera) and drawn over the ones below. `key` picks another kind
// of item to scatter (old-town courtyards over a town).
export function scatterItems(
  feature: TerrainFeature,
  ctx: ScatterContext = {},
  key: string = feature.kind
): TerrainStroke[] {
  const spec = SCATTER[key];
  if (!spec || feature.points.length < 3) return [];
  const poly = sampleCurve(feature.points, true, 8);
  const holes = (feature.holes ?? []).map((hole) => sampleCurve(hole, true, 8));
  const inShape = (p: PathPoint) =>
    inPolygon(p, poly) && !holes.some((h) => inPolygon(p, h));
  const fits =
    ctx.fits ??
    ((x: number, y: number, r: number) =>
      inShape({ x, y }) && ringPoints(x, y, r).every(inShape));
  const x0 = Math.min(...poly.map((p) => p.x));
  const x1 = Math.max(...poly.map((p) => p.x));
  const y0 = Math.min(...poly.map((p) => p.y));
  const y1 = Math.max(...poly.map((p) => p.y));
  const { cell } = spec;
  const items: Item[] = [];
  for (let iy = Math.floor(y0 / cell) - 1; iy <= Math.ceil(y1 / cell) + 1; iy++)
    for (
      let ix = Math.floor(x0 / cell) - 1;
      ix <= Math.ceil(x1 / cell) + 1;
      ix++
    ) {
      const rand = cellRandom(key === "walled" ? "town" : key, ix, iy);
      if (rand() > spec.chance) continue;
      const shift = spec.stagger && iy % 2 !== 0 ? cell / 2 : 0;
      const x = (ix + 0.5) * cell + shift + (rand() - 0.5) * cell * spec.jitter;
      const y = (iy + 0.5) * cell + (rand() - 0.5) * cell * spec.jitter;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const height = Math.max(0, ctx.height?.(x, y) ?? 0);
      const item = spec.make(x, y, rand, {
        snowy: !!ctx.snowy?.(x, y),
        scale: 1 + 0.22 * Math.min(height, 1.5),
      });
      if (!fits(x, y, item.r)) continue;
      if (ctx.owns && !ctx.owns(x, y)) continue;
      if (ctx.blocked?.(x, y, item.r)) continue;
      // no building on top of another
      const outline = item.outline;
      if (
        outline &&
        items.some(
          (o) =>
            o.outline &&
            Math.hypot(
              o.outline[0].x - outline[0].x,
              o.outline[0].y - outline[0].y
            ) <
              2 * (o.r + item.r) &&
            rectsOverlap(o.outline, outline)
        )
      )
        continue;
      item.level = Math.min(LEVELS - 1, Math.floor(height * 3));
      items.push(item);
      ctx.placed?.(x, y, item.r);
    }
  return itemStrokes(key, items);
}
