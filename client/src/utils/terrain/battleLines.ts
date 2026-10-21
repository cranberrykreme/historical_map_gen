// Battle drawing, stage 2: where each line runs. Rivers and streams stop at the shore and
// get mouths and sources; other lines stop at water (and walls at rivers).

import { LineRun, RIVER_WIDTH, TerrainStroke, sampleCurve } from "./terrain";
import {
  BREAKS_AT_RIVERS,
  P,
  STOPS_AT_WATER,
  SegmentGrid,
  mouth,
  nearestDistance,
  splitRun,
  unit,
} from "./battleGeometry";
import type { Ground } from "./battleGround";

export function runLines(g: Ground) {
  const { lines, nearEdge, rimAt, water } = g;
  // ---- Rivers and streams: where they run on land, their mouths and their sources ----
  const riverLines = lines
    .filter((f) => f.kind === "river" || f.kind === "stream")
    .map((feature) => {
      const dense = sampleCurve(feature.points, false, 5);
      return { feature, dense, wet: dense.map(water) };
    });
  const mouths: TerrainStroke[] = [];
  const lineRuns = new Map<string, LineRun[]>();
  const reachesWater = new Set<string>();
  for (const { feature, dense, wet } of riverLines) {
    const [bank] = RIVER_WIDTH[feature.kind]!;
    const light = feature.kind === "river" ? "#6fa6db" : "#7fb2e0";
    const others = riverLines.filter((r) => r.feature.id !== feature.id);
    // What's at an end of the line: it runs off the battle, into another river, or nowhere
    const end = (p: P) =>
      nearEdge(p)
        ? "open"
        : others.some(
              (o) =>
                nearestDistance(p, o.dense) <
                RIVER_WIDTH[o.feature.kind]![0] / 2 + 6
            )
          ? "join"
          : "free";
    const runs: LineRun[] = [];
    for (const { from, to } of splitRun(dense, (_, i) => !wet[i])) {
      const startsInWater = from > 0;
      const endsInWater = to < dense.length - 1;
      // Into the water, a river runs on well past the shore and is clipped there (see
      // landShapes), and its mouth fans out from just past the beach
      const steps = (i: number, extra: number) =>
        Math.ceil((rimAt(dense[i]) + extra) / 5);
      const a = startsInWater ? Math.max(from - steps(from, 40), 0) : from;
      const b = endsInWater
        ? Math.min(to + steps(to, 40), dense.length - 1)
        : to;
      const run = dense.slice(a, b + 1);
      if (run.length < 2) continue;
      if (startsInWater) {
        const m = Math.max(from - steps(from, 3), 0);
        mouths.push(
          ...mouth(dense[m], unit(dense[m + 1], dense[m]), bank * 1.3, light)
        );
      }
      if (endsInWater) {
        const m = Math.min(to + steps(to, 3), dense.length - 1);
        mouths.push(
          ...mouth(dense[m], unit(dense[m - 1], dense[m]), bank * 1.3, light)
        );
      }
      if (startsInWater || endsInWater) reachesWater.add(feature.id);
      const startFree = !startsInWater && end(dense[0]) === "free";
      const endFree = !endsInWater && end(dense[dense.length - 1]) === "free";
      runs.push({
        run,
        start: startsInWater ? "flare" : startFree ? "taper" : "round",
        end: endsInWater ? "flare" : endFree && !startFree ? "taper" : "round",
      });
    }
    lineRuns.set(feature.id, runs);
  }
  const riverRuns = riverLines.flatMap(({ feature }) =>
    (lineRuns.get(feature.id) ?? []).map((r) => ({
      kind: feature.kind,
      run: r.run,
    }))
  );
  const riverGrid = new SegmentGrid();
  for (const { kind, run } of riverRuns)
    riverGrid.addRun(run, RIVER_WIDTH[kind]![0] / 2 + 3);
  const inRiver = (p: P) => riverGrid.within(p, 0);

  // ---- Every other line, stopping at water (and walls at rivers) ----
  for (const feature of lines) {
    if (lineRuns.has(feature.id)) continue;
    const dense = sampleCurve(feature.points, false, 4);
    if (!STOPS_AT_WATER.has(feature.kind)) {
      lineRuns.set(feature.id, [{ run: dense }]);
      continue;
    }
    const breaks = BREAKS_AT_RIVERS.has(feature.kind);
    const keep = dense.map((p) => !water(p) && !(breaks && inRiver(p)));
    lineRuns.set(
      feature.id,
      splitRun(dense, (_, i) => keep[i])
        .map(({ from, to }) => ({ run: dense.slice(from, to + 1) }))
        .filter((r) => r.run.length >= 2)
    );
  }
  return {
    riverLines,
    mouths,
    lineRuns,
    reachesWater,
    riverRuns,
    riverGrid,
    inRiver,
  };
}

export type LineRuns = ReturnType<typeof runLines>;
