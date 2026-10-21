// Battle drawing, stage 1: the ground. Every area and line, where the water and the land
// are, how high the ground is, and where snow lies.

import { BattleKind, TerrainFeature } from "../../types";
import {
  areaCentre,
  baseStrokes,
  isLine,
  polylinePath,
  sampleCurve,
  sortedFeatures,
} from "./terrain";
import {
  Area,
  EDGE,
  P,
  WATER_KINDS,
  areaEdges,
  boxOf,
  inArea,
  makeArea,
  nearestDistance,
  offset,
  reachToEdge,
  waterAt,
} from "./battleGeometry";

export function groundOf(
  features: TerrainFeature[],
  ground: BattleKind,
  width: number,
  height: number
) {
  const sorted = sortedFeatures(features);
  const areas = sorted.filter((f) => !isLine(f.kind)).map(makeArea);
  const water = (p: P) => waterAt(p, areas, ground);
  const lines = sorted.filter((f) => isLine(f.kind));
  // How far an area's edge line reaches out past its shape (an island's beach). The edge is
  // drawn twice as wide under the fill, so all of its width shows outside.
  const rims = new Map(
    areas.map((a) => [a.feature.id, baseStrokes(a.feature)[0]?.width ?? 0])
  );
  const rimOf = (area: Area) =>
    WATER_KINDS.has(area.feature.kind) ? 0 : (rims.get(area.feature.id) ?? 0);
  const rimAt = (p: P) => {
    for (let i = areas.length - 1; i >= 0; i--)
      if (inArea(p, areas[i])) return rimOf(areas[i]);
    return 0;
  };
  const nearEdge = (p: P) =>
    p.x < EDGE || p.y < EDGE || p.x > width - EDGE || p.y > height - EDGE;
  const snowAreas = areas.filter((a) => a.feature.kind === "snow");
  const underSnow = (p: P) => snowAreas.some((a) => inArea(p, a));

  // How high the ground is at a point: a dome over each hill (1 at the top) and mountain
  // (higher still), and a long rise along each ridge
  const highGround = areas
    .filter((a) => a.feature.kind === "hill" || a.feature.kind === "mountain")
    .map((area) => ({
      area,
      middle: areaCentre(area.feature.points),
      peak: area.feature.kind === "mountain" ? 1.5 : 1,
    }));
  const ridges = lines
    .filter((l) => l.kind === "ridge")
    .map((l) => {
      const run = sampleCurve(l.points, false, 6);
      const box = boxOf(run);
      return { run, box };
    });
  const RIDGE_HALF = 23;
  const heightAt = (p: P) => {
    let h = 0;
    for (const { area, middle, peak } of highGround) {
      if (!inArea(p, area)) continue;
      const reach = reachToEdge(middle, p, area.poly);
      const s =
        reach > 0
          ? Math.min(1, Math.hypot(p.x - middle.x, p.y - middle.y) / reach)
          : 0;
      h = Math.max(h, peak * (1 - s * s));
    }
    for (const { run, box } of ridges) {
      if (
        p.x < box.x0 - RIDGE_HALF ||
        p.x > box.x1 + RIDGE_HALF ||
        p.y < box.y0 - RIDGE_HALF ||
        p.y > box.y1 + RIDGE_HALF
      )
        continue;
      const d = nearestDistance(p, run);
      if (d < RIDGE_HALF) h = Math.max(h, 1 - (d / RIDGE_HALF) ** 2);
    }
    return h;
  };

  // Where the land ends, beaches included, as clip shapes: rivers are drawn only inside them,
  // so a river into the sea stops exactly at the shore
  const landShapes: string[] = areas
    .filter((a) => !WATER_KINDS.has(a.feature.kind))
    .map((a) => {
      // the edge and the holes' edges, each moved out past the beach (into the holes too)
      const edges = areaEdges(a, () => true);
      return edges.length
        ? edges
            .map((edge) => polylinePath(offset(edge, rimOf(a) + 1), true))
            .join("")
        : a.d;
    });
  if (ground === "land")
    landShapes.unshift(
      `M-50 -50H${width + 50}V${height + 50}H-50Z` +
        areas
          .filter((a) => WATER_KINDS.has(a.feature.kind))
          .map((a) =>
            [a.poly, ...a.holes]
              .map((ring) => polylinePath(ring, true))
              .join("")
          )
          .join("")
    );
  return {
    ground,
    width,
    height,
    sorted,
    areas,
    water,
    lines,
    rims,
    rimOf,
    rimAt,
    nearEdge,
    snowAreas,
    underSnow,
    highGround,
    ridges,
    RIDGE_HALF,
    heightAt,
    landShapes,
  };
}

export type Ground = ReturnType<typeof groundOf>;
