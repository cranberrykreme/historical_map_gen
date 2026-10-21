// Battle drawing, stage 6: every line, kind by kind and joined up, with snow on them, and
// bridges and fords where roads cross rivers and streams.

import { TerrainKind } from "../../types";
import {
  RIVER_WIDTH,
  TERRAIN_KINDS,
  TerrainStroke,
  circlePath,
  lineStrokes,
  polylinePath,
  sampleCurve,
} from "./terrain";
import {
  crossings,
  inArea,
  interleave,
  nearestDistance,
} from "./battleGeometry";
import type { Ground } from "./battleGround";
import type { LineRuns } from "./battleLines";

export function drawLines(g: Ground, lr: LineRuns, out: TerrainStroke[]): void {
  const { landShapes, lines, snowAreas, water } = g;
  const { lineRuns, reachesWater, riverRuns } = lr;
  // ---- Lines, kind by kind, joined up ----
  const groups: TerrainKind[][] = [
    ["river", "stream"],
    // (ridges are drawn with the high ground)
    ...TERRAIN_KINDS.filter(
      (k) =>
        k.shape === "line" &&
        k.kind !== "river" &&
        k.kind !== "stream" &&
        k.kind !== "ridge"
    ).map((k) => [k.kind]),
  ];
  const userBridges = lines
    .filter((f) => f.kind === "bridge")
    .map((f) => sampleCurve(f.points, false, 5));
  for (const kinds of groups) {
    const members = lines.filter((f) => kinds.includes(f.kind));
    out.push(
      ...interleave(
        members.map((f) =>
          lineStrokes(f.kind, lineRuns.get(f.id) ?? []).map((s) =>
            // A river into water is drawn only on land, so it ends exactly at the shore
            reachesWater.has(f.id)
              ? { ...s, clip: landShapes, clipRule: "evenodd" as const }
              : s
          )
        )
      )
    );
    // Under snow, rivers freeze and roads are dusted white
    for (const cover of snowAreas)
      for (const f of members) {
        const runs = (lineRuns.get(f.id) ?? []).map((r) => r.run);
        if (!runs.some((run) => run.some((p) => inArea(p, cover)))) continue;
        const d = runs.map((run) => polylinePath(run)).join("");
        if (f.kind === "river" || f.kind === "stream")
          out.push({
            d,
            stroke: "#e3eff5",
            width: RIVER_WIDTH[f.kind]![0] - 5,
            clip: cover.d,
            clipRule: cover.rule,
          });
        else if (f.kind === "road")
          out.push({
            d,
            stroke: "#f1f4f6",
            width: 9,
            opacity: 0.8,
            dash: "6 3",
            clip: cover.d,
            clipRule: cover.rule,
          });
      }
    if (kinds[0] !== "road") continue;
    // Bridges and fords where roads cross rivers and streams
    for (const road of members)
      for (const { run } of lineRuns.get(road.id) ?? [])
        for (const { kind, run: river } of riverRuns)
          for (const { at, dir } of crossings(run, river)) {
            if (userBridges.some((b) => nearestDistance(at, b) < 30)) continue;
            if (water(at)) continue;
            const [bank] = RIVER_WIDTH[kind]!;
            if (kind === "river") {
              const half = bank / 2 + 10;
              out.push(
                ...lineStrokes("bridge", [
                  {
                    run: [
                      { x: at.x - dir.x * half, y: at.y - dir.y * half },
                      { x: at.x + dir.x * half, y: at.y + dir.y * half },
                    ],
                  },
                ])
              );
            } else {
              const piece = river.filter(
                (p) => Math.hypot(p.x - at.x, p.y - at.y) < 13
              );
              out.push(
                ...lineStrokes("stream", [{ run: piece }]).map((s) => ({
                  ...s,
                  opacity: 0.8,
                }))
              );
              const n = { x: -dir.y, y: dir.x };
              for (const k of [-1, 0, 1])
                out.push({
                  d: circlePath(
                    at.x + dir.x * k * 4.5 + n.x * k * 1.5,
                    at.y + dir.y * k * 4.5 + n.y * k * 1.5,
                    2.2
                  ),
                  fill: "#c4bfb0",
                  stroke: "#7f7a6c",
                  width: 0.8,
                });
            }
          }
  }
}
