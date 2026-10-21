// Battle drawing, stage 4: the areas, kind by kind, with the ways they meet water and each
// other, high ground's light and shade, snow, and the trees, rocks and houses scattered on them.

import {
  TERRAIN_KINDS,
  TerrainStroke,
  baseStrokes,
  holesPath,
  lineStrokes,
  polylinePath,
  scatterItems,
  shrink,
  smoothPath,
} from "./terrain";
import {
  Area,
  P,
  SegmentGrid,
  TOWN_KINDS,
  WALL_INSET,
  WALL_ROOM,
  WATER_KINDS,
  WOOD_KINDS,
  areaEdges,
  edgePath,
  inArea,
  overlaps,
} from "./battleGeometry";
import type { Ground } from "./battleGround";
import type { LineRuns } from "./battleLines";
import type { TownLayout } from "./battleTowns";

export function drawAreas(
  g: Ground,
  lr: LineRuns,
  towns: TownLayout,
  out: TerrainStroke[]
): void {
  const {
    areas,
    ground,
    heightAt,
    highGround,
    lines,
    rimOf,
    snowAreas,
    underSnow,
    water,
  } = g;
  const { lineRuns, mouths } = lr;
  const { clearance, plans } = towns;
  // Where an area's items may go: wholly inside the areas of its kind (and inside the wall of
  // a walled town), drawn by the first of them that covers the spot, and clear of later areas
  // over it, of roads, rivers and walls
  const scatterFor = (area: Area, index: number) => {
    const kind = area.feature.kind;
    const same = areas.filter((a) => a.feature.kind === kind);
    const mine = same.indexOf(area);
    const margin = kind === "walled" ? WALL_INSET + WALL_ROOM : 0;
    const inSame = (p: P) => same.some((a) => inArea(p, a));
    // The outer edge of all the areas of this kind together: the parts of each one's edge
    // that aren't inside another
    const edges = new SegmentGrid();
    for (const a of same) {
      const others = same.filter((o) => o !== a);
      for (const ring of [a.poly, ...a.holes]) {
        const n = ring.length;
        for (let i = 0; i < n; i++) {
          const p = ring[i];
          const q = ring[(i + 1) % n];
          const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
          if (!others.some((o) => inArea(mid, o))) edges.add(p, q);
        }
      }
    }
    // Areas drawn over this one, which would hide part of an item
    const covering = areas.filter(
      (a, i) => i > index && a.feature.kind !== kind && overlaps(a, area)
    );
    const coverEdges = new SegmentGrid();
    // their edge line reaches a little past their shape
    for (const a of covering)
      for (const ring of [a.poly, ...a.holes])
        coverEdges.addRun(ring, rimOf(a) + 1.5, true);
    // Roads, rivers and walls, with the room each needs kept clear
    const pad = 80;
    const near = (p: P) =>
      p.x > area.box.x0 - pad &&
      p.x < area.box.x1 + pad &&
      p.y > area.box.y0 - pad &&
      p.y < area.box.y1 + pad;
    const obstacles = new SegmentGrid();
    for (const line of lines) {
      // trees and houses stand on a ridge, not round it
      if (line.kind === "bridge" || line.kind === "ridge") continue;
      const room = clearance(line, area);
      for (const { run } of lineRuns.get(line.id) ?? [])
        for (let i = 1; i < run.length; i++)
          if (near(run[i])) obstacles.add(run[i - 1], run[i], room);
    }
    // a town's square and church, and its old-town blocks once they're placed
    const keepOut = [...(plans.get(area)?.keepOut ?? [])];
    return {
      keepOut,
      fits: (x: number, y: number, r: number) =>
        inSame({ x, y }) && !edges.within({ x, y }, r + margin),
      owns: (x: number, y: number) =>
        !same.slice(0, mine).some((a) => inArea({ x, y }, a)),
      blocked: (x: number, y: number, r: number) =>
        covering.some((a) => inArea({ x, y }, a)) ||
        coverEdges.within({ x, y }, r) ||
        obstacles.within({ x, y }, r) ||
        keepOut.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r + 2),
      snowy: (x: number, y: number) => underSnow({ x, y }),
      height: (x: number, y: number) => heightAt({ x, y }),
    };
  };

  // ---- Areas, kind by kind ----
  for (const { kind } of TERRAIN_KINDS) {
    const ofKind = areas.filter((a) => a.feature.kind === kind);
    if (ofKind.length > 0) {
      const strokes = ofKind.map((a) => baseStrokes(a.feature));
      const before: TerrainStroke[] = [];
      const after: TerrainStroke[] = [];
      for (let i = 0; i < ofKind.length; i++) {
        const area = ofKind[i];
        const rim = strokes[i][0]?.width ?? 0;
        if (WATER_KINDS.has(kind)) {
          // Water meeting land: a beach for the sea, a shoreline and a damp bank for a lake
          const shore = areaEdges(
            area,
            (p, n) => !water({ x: p.x + n.x * 9, y: p.y + n.y * 9 })
          );
          for (const edge of shore) {
            if (kind === "deep" || kind === "shallows") {
              before.push({ d: edgePath(edge), stroke: "#dccb93", width: 26 });
              if (kind === "deep")
                after.push({
                  d: edgePath(edge, -15),
                  stroke: "#7fb6d9",
                  width: 20,
                  opacity: 0.45,
                });
              after.push({
                d: edgePath(edge, -4),
                stroke: "#eaf4f8",
                width: 2.5,
                opacity: 0.7,
              });
            } else if (kind === "lake") {
              // a crisp edge tracing the shore, inside a damp green bank
              before.push({
                d: edgePath(edge),
                stroke: "#6f8f4f",
                width: 26,
                opacity: 0.5,
              });
              after.push({ d: edgePath(edge), stroke: "#2f6aa0", width: 3 });
              after.push({
                d: edgePath(edge, -4),
                stroke: "#8cc0e8",
                width: 2,
                opacity: 0.7,
              });
            }
          }
        } else {
          // Land meeting water
          const coast = areaEdges(area, (p, n) =>
            water({ x: p.x + n.x * (rim + 9), y: p.y + n.y * (rim + 9) })
          );
          for (const edge of coast) {
            if (kind === "marsh") {
              // Wetter towards the water, fading into the marsh, and only inside the marsh
              for (const [band, opacity] of [
                [44, 0.25],
                [26, 0.3],
                [12, 0.35],
              ])
                after.push({
                  d: edgePath(edge),
                  stroke: "#6f9fa0",
                  width: band,
                  opacity,
                  cap: "butt",
                  clip: area.d,
                  clipRule: area.rule,
                });
            } else {
              before.push({
                d: edgePath(edge),
                stroke: "#7fb6d9",
                width: rim * 2 + 30,
                opacity: 0.5,
              });
              before.push({
                d: edgePath(edge, rim + 8),
                stroke: "#eaf4f8",
                width: 2.5,
                opacity: 0.75,
              });
            }
          }
        }
      }
      // High ground casts a soft shadow away from the light
      if (kind === "hill" || kind === "mountain")
        for (const area of ofKind) {
          const shift = (ring: P[]) =>
            smoothPath(
              ring.map((p) => ({ x: p.x + 10, y: p.y + 12 })),
              true
            );
          before.unshift({
            d:
              shift(area.feature.points) +
              (area.feature.holes ?? []).map(shift).join(""),
            fill: "#2a2a10",
            opacity: 0.14,
            shading: true,
            fillRule: area.rule,
          });
        }
      out.push(...before);
      // Every outline under every fill, so overlapping shapes of one kind become one
      for (const list of strokes) {
        const s = list[0];
        if (s?.stroke)
          out.push({
            d: s.d,
            stroke: s.stroke,
            width: (s.width ?? 1) * 2,
            opacity: s.opacity,
          });
      }
      for (const list of strokes) {
        const s = list[0];
        if (s)
          out.push({
            d: s.d,
            fill: s.fill,
            opacity: s.opacity,
            fillRule: s.fillRule,
          });
      }
      for (const list of strokes) out.push(...list.slice(1));
      out.push(...after);
      // A mountain under snow is paler, under its snowy peaks
      if (kind === "mountain")
        for (const high of ofKind)
          for (const cover of snowAreas)
            if (overlaps(high, cover))
              out.push({
                d: high.d,
                fill: "#f2f6f8",
                opacity: 0.45,
                fillRule: high.rule,
                clip: cover.d,
                clipRule: cover.rule,
              });
      // The ground under trees and between houses is white under snow
      if (WOOD_KINDS.has(kind) || TOWN_KINDS.has(kind))
        for (const area of ofKind)
          for (const cover of snowAreas)
            if (overlaps(area, cover))
              out.push({
                d: area.d,
                fill: "#f4f7f9",
                opacity: 0.6,
                fillRule: area.rule,
                clip: cover.d,
                clipRule: cover.rule,
              });
      for (const area of ofKind) {
        const ctx = scatterFor(area, areas.indexOf(area));
        // a town's old-town blocks first, then its houses round them
        if (TOWN_KINDS.has(kind))
          out.push(
            ...scatterItems(
              area.feature,
              { ...ctx, placed: (x, y, r) => ctx.keepOut.push({ x, y, r }) },
              "courtyard"
            )
          );
        out.push(...scatterItems(area.feature, ctx));
      }
    }

    // Rivers' mouths, on the water but under any land, marsh or beach drawn over it
    if (kind === "reef") out.push(...mouths);

    // Water under snow is frozen over: ice over the snow, where the water is
    if (kind === "snow")
      for (const cover of snowAreas) {
        const pools = areas.filter(
          (a) => WATER_KINDS.has(a.feature.kind) && overlaps(cover, a)
        );
        // in a sea battle the open sea is water too
        const shapes = ground === "sea" ? [cover] : pools;
        const clip = { clip: cover.d, clipRule: cover.rule };
        for (const { d, rule } of shapes)
          out.push(
            { d, fill: "#e3eff5", opacity: 0.95, fillRule: rule, ...clip },
            { d, fill: "pattern:ice", fillRule: rule, ...clip },
            { d, stroke: "#8fb6cc", width: 3, ...clip }
          );
      }

    // Ridges: long, narrow hills among the high ground, with a soft shadow
    if (kind === "mountain")
      for (const ridge of lines.filter((l) => l.kind === "ridge")) {
        const runs = lineRuns.get(ridge.id) ?? [];
        out.push({
          d: runs
            .map(({ run }) =>
              polylinePath(run.map((p) => ({ x: p.x + 10, y: p.y + 12 })))
            )
            .join(""),
          stroke: "#2a2a10",
          width: 46,
          opacity: 0.12,
          shading: true,
        });
        out.push(...lineStrokes("ridge", runs));
      }

    // A hill under snow turns white
    if (kind === "mountain") {
      for (const high of areas.filter((a) => a.feature.kind === "hill"))
        for (const cover of snowAreas)
          if (overlaps(high, cover))
            out.push({
              d: high.d,
              fill: "#f2f6f8",
              opacity: 0.55,
              fillRule: high.rule,
              clip: cover.d,
              clipRule: cover.rule,
            });
    }
    // High ground lit from the top left and shaded to the bottom right, over the trees and
    // houses standing on it
    if (kind === "walled")
      for (const { area } of highGround) {
        const points = area.feature.points;
        const rings = area.feature.kind === "hill" ? [1, 0.68, 0.38] : [1, 0.6];
        for (const factor of rings)
          out.push({
            d:
              smoothPath(shrink(points, factor), true) +
              holesPath(area.feature),
            fill: "pattern:shade",
            opacity: area.feature.kind === "hill" ? 0.5 : 0.4,
            shading: true,
            fillRule: area.rule,
          });
      }
    // and ridges lit along their top-left side, shaded along the other
    if (kind === "walled")
      for (const ridge of lines.filter((l) => l.kind === "ridge")) {
        const runs = lineRuns.get(ridge.id) ?? [];
        const shifted = (dx: number, dy: number) =>
          runs
            .map(({ run }) =>
              polylinePath(run.map((p) => ({ x: p.x + dx, y: p.y + dy })))
            )
            .join("");
        out.push({
          d: shifted(-6, -7),
          stroke: "#ffffff",
          width: 24,
          opacity: 0.11,
          shading: true,
        });
        out.push({
          d: shifted(6, 7),
          stroke: "#000000",
          width: 24,
          opacity: 0.1,
          shading: true,
        });
      }
  }
}
