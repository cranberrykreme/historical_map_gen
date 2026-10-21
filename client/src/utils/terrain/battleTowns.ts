// Battle drawing, stage 3: how much room each line needs, each walled town's wall and gates,
// and each town's market square and church.

import { TerrainFeature } from "../../types";
import { LINE_WIDTH, alongLine, areaCentre, ringPoints } from "./terrain";
import {
  Area,
  LANE_LINES,
  P,
  STREET_ROOM,
  SegmentGrid,
  TOWN_KINDS,
  WALL_INSET,
  WALL_ROOM,
  crossings,
  edgeRuns,
  inArea,
  offset,
  splitRun,
} from "./battleGeometry";
import type { Ground } from "./battleGround";
import type { LineRuns } from "./battleLines";

// A town's plan: its market square and church, and where no other building goes
export interface TownPlan {
  square?: { at: P; angle: number; long: number; deep: number };
  church?: { at: P; angle: number };
  keepOut: { x: number; y: number; r: number }[]; // where no other building goes
}

export function townLayout(g: Ground, lr: LineRuns) {
  const { areas, lines } = g;
  const { lineRuns } = lr;
  // How much room each line needs kept clear of an area's items: a lane through a wood or a
  // street through a town, or just the line itself
  const clearance = (line: TerrainFeature, area: Area) => {
    const w = LINE_WIDTH[line.kind] ?? 10;
    if (!LANE_LINES.has(line.kind)) return w / 2 + 2;
    if (TOWN_KINDS.has(area.feature.kind))
      return line.kind === "road" ? STREET_ROOM : (w + 30) / 2 + 2;
    return (w + 24) / 2 + 1;
  };
  // A walled town's wall and its gates, worked out once
  const walls = new Map<Area, { runs: P[][]; gates: P[] }>();
  for (const area of areas.filter((a) => a.feature.kind === "walled")) {
    const edge = edgeRuns(area.poly, () => true)[0];
    if (!edge) continue;
    const ring = offset(edge, -WALL_INSET);
    const closed = [...ring, ring[0]];
    const gates: { at: P; half: number }[] = [];
    for (const line of lines.filter((l) => LANE_LINES.has(l.kind)))
      for (const { run } of lineRuns.get(line.id) ?? [])
        for (const { at } of crossings(closed, run))
          gates.push({
            at,
            half:
              line.kind === "road" ? 14 : (LINE_WIDTH[line.kind] ?? 10) / 2 + 6,
          });
    const keep = ring.map((p) =>
      gates.every((g) => Math.hypot(p.x - g.at.x, p.y - g.at.y) > g.half)
    );
    let runs: P[][];
    if (keep.every(Boolean)) runs = [closed];
    else {
      // start from a gap, so a wall running round past the first point stays in one piece
      const start = keep.indexOf(false);
      const turned = [...ring.slice(start), ...ring.slice(0, start)];
      const turnedKeep = [...keep.slice(start), ...keep.slice(0, start)];
      runs = splitRun(turned, (_, i) => turnedKeep[i]).map(({ from, to }) =>
        turned.slice(from, to + 1)
      );
    }
    walls.set(area, {
      runs: runs.filter((r) => r.length >= 2),
      gates: gates.map((g) => g.at),
    });
  }

  // ---- Each town's plan: a market square on its main street, and a church ----
  const roadGrid = new SegmentGrid();
  for (const line of lines.filter((l) => l.kind === "road"))
    for (const { run } of lineRuns.get(line.id) ?? []) roadGrid.addRun(run);
  const plans = new Map<Area, TownPlan>();
  for (const area of areas.filter((a) => TOWN_KINDS.has(a.feature.kind))) {
    const margin = area.feature.kind === "walled" ? WALL_INSET + WALL_ROOM : 4;
    const fitsIn = (p: P, r: number) =>
      inArea(p, area) &&
      ringPoints(p.x, p.y, r + margin).every((q) => inArea(q, area));
    let size = 0;
    area.poly.forEach((p, i) => {
      const q = area.poly[(i + 1) % area.poly.length];
      size += p.x * q.y - q.x * p.y;
    });
    size = Math.abs(size) / 2;
    const middle = areaCentre(area.poly);
    const plan: TownPlan = { keepOut: [] };
    // the market square: on the street nearest the middle of town, or in the middle
    if (size > 35000) {
      let best: { at: P; angle: number; distance: number } | null = null;
      for (const line of lines.filter((l) => l.kind === "road"))
        for (const { run } of lineRuns.get(line.id) ?? [])
          for (const { x, y, dx, dy } of alongLine(run, 8)) {
            const distance = Math.hypot(x - middle.x, y - middle.y);
            if ((!best || distance < best.distance) && fitsIn({ x, y }, 44))
              best = { at: { x, y }, angle: Math.atan2(dy, dx), distance };
          }
      if (best)
        plan.square = { at: best.at, angle: best.angle, long: 66, deep: 60 };
      else if (fitsIn(middle, 36))
        plan.square = { at: middle, angle: 0, long: 50, deep: 50 };
      if (plan.square) plan.keepOut.push({ ...plan.square.at, r: 46 });
    }
    // the church: the first spot near the middle with room for it, clear of the streets
    if (size > 50000)
      search: for (let ring = 0; ring <= 300; ring += 18)
        for (let k = 0; k < (ring === 0 ? 1 : 12); k++) {
          const a = (k / 12) * Math.PI * 2;
          const at = {
            x: middle.x + Math.cos(a) * ring,
            y: middle.y + Math.sin(a) * ring,
          };
          if (!fitsIn(at, 34)) continue;
          if (roadGrid.within(at, 34 + STREET_ROOM)) continue;
          if (
            plan.keepOut.some(
              (o) => Math.hypot(o.x - at.x, o.y - at.y) < o.r + 36
            )
          )
            continue;
          plan.church = { at, angle: 0 };
          plan.keepOut.push({ ...at, r: 36 });
          break search;
        }
    plans.set(area, plan);
  }
  return {
    clearance,
    walls,
    roadGrid,
    plans,
  };
}

export type TownLayout = ReturnType<typeof townLayout>;
