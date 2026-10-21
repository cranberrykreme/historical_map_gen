// Battle drawing, stage 5: lanes through woods and streets through towns, terrace houses,
// market squares, churches and town walls.

import {
  GROUND_COLOUR,
  Item,
  LINE_WIDTH,
  TerrainStroke,
  alongLine,
  baseStrokes,
  church,
  circlePath,
  house,
  itemStrokes,
  lineStrokes,
  polylinePath,
  rectCorners,
  rectsOverlap,
  ringPoints,
} from "./terrain";
import {
  Area,
  LANE_LINES,
  P,
  ROW_SET_BACK,
  STREET,
  SegmentGrid,
  TOWN_KINDS,
  UNIT_DEEP,
  UNIT_LONG,
  WALL_INSET,
  WALL_ROOM,
  WOOD_KINDS,
  inArea,
  overlaps,
} from "./battleGeometry";
import type { Ground } from "./battleGround";
import type { LineRuns } from "./battleLines";
import type { TownLayout } from "./battleTowns";

export function drawStreets(
  g: Ground,
  lr: LineRuns,
  towns: TownLayout,
  out: TerrainStroke[]
): void {
  const { areas, heightAt, lines, snowAreas, underSnow } = g;
  const { lineRuns } = lr;
  const { plans, walls } = towns;
  // ---- Lanes through woods, streets through towns ----
  // Each is drawn along the whole line but clipped to the wood or town, so it starts and
  // stops exactly at its edge
  const settled = areas.filter(
    (a) => WOOD_KINDS.has(a.feature.kind) || TOWN_KINDS.has(a.feature.kind)
  );
  const laneLines = lines.filter((f) => LANE_LINES.has(f.kind));
  const streetHouses = new Map<
    Area,
    { x: number; y: number; corners: P[]; row: string; item: Item }[]
  >();
  for (const feature of laneLines) {
    const runs = (lineRuns.get(feature.id) ?? []).map((r) => r.run);
    const d = runs.map((run) => polylinePath(run)).join("");
    const w = LINE_WIDTH[feature.kind] ?? 10;
    const road = feature.kind === "road";
    // Where the other roads and rivers run, so houses aren't built on them
    const others = new SegmentGrid();
    for (const o of laneLines)
      if (o.id !== feature.id)
        for (const { run } of lineRuns.get(o.id) ?? [])
          others.addRun(run, (LINE_WIDTH[o.kind] ?? 10) / 2 + 10);
    for (const area of settled) {
      if (!runs.some((run) => run.some((p) => inArea(p, area)))) continue;
      if (!TOWN_KINDS.has(area.feature.kind)) {
        // A clearing through the trees, edged like the wood
        const edge = baseStrokes(area.feature)[0]?.stroke ?? "#4a7030";
        out.push({
          d,
          stroke: edge,
          width: w + 24,
          clip: area.d,
          clipRule: area.rule,
        });
        out.push({
          d,
          stroke: GROUND_COLOUR.land,
          width: w + 18,
          clip: area.d,
          clipRule: area.rule,
        });
        for (const cover of snowAreas)
          if (overlaps(area, cover))
            out.push({
              d,
              stroke: "#f4f7f9",
              width: w + 18,
              opacity: 0.75,
              clip: cover.d,
              clipRule: cover.rule,
            });
        continue;
      }
      // Through a town: a cleared street (or a stone quay for a river), lined on each side with
      // rows of terrace houses, each house wholly inside the town (and its wall)
      const inTown = { clip: area.d, clipRule: area.rule };
      out.push({
        d,
        stroke: "#cbbf9f",
        width: road ? STREET : w + 30,
        ...inTown,
      });
      out.push({
        d,
        stroke: road ? "#bfb193" : "#a59c88",
        width: w + 12,
        ...inTown,
      });
      if (!road) continue;
      const margin =
        area.feature.kind === "walled" ? WALL_INSET + WALL_ROOM : 0;
      const keepOut = plans.get(area)?.keepOut ?? [];
      const list = streetHouses.get(area) ?? [];
      // This road itself, so a house on the inside of a tight bend isn't built on it
      const ownRoad = new SegmentGrid();
      for (const run of runs) ownRoad.addRun(run, ROW_SET_BACK - 4);
      const inside = (p: P, r: number) =>
        inArea(p, area) &&
        ringPoints(p.x, p.y, r + margin).every((q) => inArea(q, area));
      runs.forEach((run, runIndex) =>
        [-1, 1].forEach((side) => {
          let row = `${feature.id}:${runIndex}:${side}:0`;
          let inRow = 0;
          let rowLength = 4;
          let rowShade = 0;
          alongLine(run, UNIT_LONG).forEach(({ x, y, dx, dy }, i) => {
            const startRow = () => {
              row = `${feature.id}:${runIndex}:${side}:${i}`;
              inRow = 0;
              // rows of 3 to 6 houses, each row its own colour
              rowLength = 3 + ((((i * 7 + side * 5 + runIndex) % 4) + 4) % 4);
              rowShade = ((((i * 3 + side) % 4) + 4) % 4) / 4;
            };
            // a narrow alley between rows
            if (inRow >= rowLength) {
              startRow();
              return;
            }
            const n = { x: -dy, y: dx };
            const c = {
              x: x + n.x * side * ROW_SET_BACK,
              y: y + n.y * side * ROW_SET_BACK,
            };
            const unitR = Math.hypot(UNIT_LONG / 2, UNIT_DEEP / 2);
            const corners = rectCorners(
              c.x,
              c.y,
              UNIT_LONG,
              UNIT_DEEP,
              Math.atan2(dy, dx)
            );
            const clear =
              inside(c, unitR - 1) &&
              !others.within(c, 0) &&
              !ownRoad.within(c, 0) &&
              !keepOut.some(
                (o) => Math.hypot(o.x - c.x, o.y - c.y) < o.r + unitR
              ) &&
              // no two houses overlapping at all, in this row or any other: houses side by
              // side in a row only touch
              !list.some(
                (o) =>
                  Math.hypot(o.x - c.x, o.y - c.y) < o.item.r + unitR &&
                  rectsOverlap(o.corners, corners)
              );
            if (!clear) {
              if (inRow > 0) startRow();
              return;
            }
            if (inRow === 0) startRow();
            const h = heightAt(c);
            const item = house(
              c.x,
              c.y,
              UNIT_LONG,
              UNIT_DEEP,
              Math.atan2(dy, dx),
              rowShade,
              underSnow(c),
              i % 2 === 0
            );
            item.level = Math.min(5, Math.floor(h * 3));
            list.push({ x: c.x, y: c.y, corners, row, item });
            inRow++;
          });
        })
      );
      streetHouses.set(area, list);
    }
  }
  // The terrace houses, after every street is cleared, so no street runs over them
  streetHouses.forEach((list, area) =>
    out.push(
      ...itemStrokes(
        area.feature.kind,
        list.map((h) => h.item)
      )
    )
  );
  // Each town's square (paved, with a well and market stalls) and church
  plans.forEach((plan) => {
    if (plan.square) {
      const { at, angle, long, deep } = plan.square;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const corner = (a: number, b: number) =>
        `${Math.round((at.x + dx * a - dy * b) * 10) / 10} ${Math.round((at.y + dy * a + dx * b) * 10) / 10}`;
      const rect = (a: number, b: number, l: number, w: number) =>
        `M${corner(a - l / 2, b - w / 2)}L${corner(a + l / 2, b - w / 2)}L${corner(a + l / 2, b + w / 2)}L${corner(a - l / 2, b + w / 2)}Z`;
      out.push({
        d: rect(0, 0, long, deep),
        fill: "#d8ccad",
        stroke: "#a89878",
        width: 1.2,
      });
      // stalls along both sides, clear of the road through the middle
      const stalls = ["#c9a36a", "#a8604a", "#d4c08a"];
      stalls.forEach((colour, k) =>
        out.push({
          d: [-1, 1]
            .map((side) =>
              [-28, -14, 14, 28]
                .filter((_, j) => (j + k) % 3 === 0)
                .map((a) => rect(a, side * (deep / 2 - 7), 10, 7))
                .join("")
            )
            .join(""),
          fill: colour,
          stroke: "#6e4a35",
          width: 0.8,
        })
      );
      out.push({
        // the well, to one side of the road
        d: circlePath(at.x + dy * 17, at.y - dx * 17, 4.5),
        fill: "#7a8a98",
        stroke: "#4f5a64",
        width: 1.2,
      });
    }
    if (plan.church) {
      const item = church(
        plan.church.at.x,
        plan.church.at.y,
        plan.church.angle,
        underSnow(plan.church.at)
      );
      out.push(...itemStrokes("town", [item]));
    }
  });
  // ---- Town walls, with towers along them and a pair at each gate ----
  walls.forEach(({ runs, gates }) => {
    out.push(
      ...lineStrokes(
        "wall",
        runs.map((run) => ({ run }))
      )
    );
    const towers: P[] = [];
    for (const run of runs) {
      alongLine(run, 70).forEach((p) => towers.push(p));
      if (gates.length > 0) towers.push(run[0], run[run.length - 1]);
    }
    if (towers.length)
      out.push({
        d: towers.map((p) => circlePath(p.x, p.y, 6.5)).join(""),
        fill: "#9a958a",
        stroke: "#5e594f",
        width: 1.5,
      });
  });
}
