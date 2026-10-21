// Terrain: buildings (houses, courtyards and churches)

import { PathPoint } from "../../types";
import { pt } from "./shapes";
import type { Item } from "./scatter";

// The corners of a rectangle turned by `angle` about (x, y), `long` along the angle and `deep`
// across it
export function rectCorners(
  x: number,
  y: number,
  long: number,
  deep: number,
  angle: number
): PathPoint[] {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const l = long / 2;
  const w = deep / 2;
  return [
    [-l, -w],
    [l, -w],
    [l, w],
    [-l, w],
  ].map(([a, b]) => ({ x: x + dx * a - dy * b, y: y + dy * a + dx * b }));
}

// Whether two outlines (convex, as corners) overlap by more than a hair: ones that only touch,
// like terrace houses side by side, don't count
export function rectsOverlap(a: PathPoint[], b: PathPoint[]): boolean {
  for (const poly of [a, b])
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
      const ax = -(q.y - p.y) / length;
      const ay = (q.x - p.x) / length;
      const pa = a.map((v) => v.x * ax + v.y * ay);
      const pb = b.map((v) => v.x * ax + v.y * ay);
      const depth =
        Math.min(Math.max(...pa), Math.max(...pb)) -
        Math.max(Math.min(...pa), Math.min(...pb));
      if (depth < 0.4) return false;
    }
  return true;
}

// A rectangle turned by `angle` about (x, y), `long` along the angle and `short` across it,
// as SVG path data; a and b shift it along and across
function box(
  x: number,
  y: number,
  long: number,
  short: number,
  angle: number,
  a0 = 0,
  b0 = 0
): string {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const corner = (a: number, b: number) =>
    pt(x + dx * (a + a0) - dy * (b + b0), y + dy * (a + a0) + dx * (b + b0));
  const l = long / 2;
  const s = short / 2;
  return `M${corner(-l, -s)}L${corner(l, -s)}L${corner(l, s)}L${corner(-l, s)}Z`;
}

// A house: a roof seen from above, turned by `angle`, its ridge along `long`: the half facing
// the light is lighter. White under snow, and maybe with a chimney.
export function house(
  x: number,
  y: number,
  long: number,
  short: number,
  angle: number,
  shade: number,
  snowy = false,
  chimney = false,
  material: "tile" | "stone" = "tile"
): Item {
  const n = { x: -Math.sin(angle), y: Math.cos(angle) };
  // which side of the ridge faces the light (the top left)
  const litSide = n.x + n.y < 0 ? 1 : -1;
  const i = Math.min(3, Math.floor(shade * 4));
  const lit = snowy ? "snow" : material === "stone" ? "stone" : `r${i}`;
  const dark = snowy ? "snowS" : material === "stone" ? "stoneS" : `r${i}s`;
  const parts = [
    {
      style: lit,
      d: box(x, y, long, short / 2, angle, 0, (litSide * short) / 4),
    },
    {
      style: dark,
      d: box(x, y, long, short / 2, angle, 0, (-litSide * short) / 4),
    },
    {
      style: snowy ? "snowEdge" : material === "stone" ? "stoneEdge" : "edge",
      d: box(x, y, long, short, angle),
    },
  ];
  if (chimney && !snowy)
    parts.push({
      style: "chimney",
      d: box(x, y, 3, 3, angle, long * 0.22, (litSide * short) / 4),
    });
  return {
    r: Math.hypot(long / 2, short / 2),
    parts,
    outline: rectCorners(x, y, long, short, angle),
  };
}

// An old-town block: wings of houses round a courtyard, closed, or open on one or two sides
export function courtyard(
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  shape: number,
  snowy = false
): Item {
  const t = 9; // how deep each wing is
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const at = (a: number, b: number) => ({
    x: x + dx * a - dy * b,
    y: y + dy * a + dx * b,
  });
  // the wings: along the top and bottom (turned with the block), down the sides (turned a
  // quarter more)
  const top = { c: at(0, -h / 2 + t / 2), long: w, angle };
  const bottom = { c: at(0, h / 2 - t / 2), long: w, angle };
  const left = {
    c: at(-w / 2 + t / 2, 0),
    long: h - 2 * t,
    angle: angle + Math.PI / 2,
  };
  const right = {
    c: at(w / 2 - t / 2, 0),
    long: h - 2 * t,
    angle: angle + Math.PI / 2,
  };
  const wings =
    shape < 0.35
      ? [top, bottom, left, right]
      : shape < 0.7
        ? [top, left, right]
        : [top, left];
  const parts: Item["parts"] = [
    {
      style: snowy ? "yardSnow" : "yard",
      d: box(x, y, w - 2 * t, h - 2 * t, angle),
    },
  ];
  wings.forEach((wing, k) =>
    parts.push(
      ...house(
        wing.c.x,
        wing.c.y,
        wing.long,
        t,
        wing.angle,
        ((k * 3 + shape * 10) % 4) / 4,
        snowy
      ).parts
    )
  );
  return {
    r: Math.hypot(w / 2, h / 2),
    parts,
    outline: rectCorners(x, y, w, h, angle),
  };
}

// A church: a cross of nave and transepts in stone, with a square tower at the west end
export function church(
  x: number,
  y: number,
  angle: number,
  snowy: boolean
): Item {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nave = house(x, y, 44, 15, angle, 0, snowy, false, "stone");
  const transept = house(
    x + dx * 7,
    y + dy * 7,
    36,
    13,
    angle + Math.PI / 2,
    0,
    snowy,
    false,
    "stone"
  );
  const tx = x - dx * 26;
  const ty = y - dy * 26;
  const tower = box(tx, ty, 14, 14, angle);
  const c = (a: number, b: number) =>
    pt(tx + dx * a - dy * b, ty + dy * a + dx * b);
  return {
    r: 33,
    parts: [
      ...nave.parts,
      ...transept.parts,
      { style: "tower", d: tower },
      {
        style: "towerRoof",
        d: `M${c(-7, -7)}L${c(7, 7)}M${c(7, -7)}L${c(-7, 7)}`,
      },
    ],
  };
}
