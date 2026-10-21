// Terrain: reading saved terrain

import { PathPoint, TerrainFeature } from "../../types";
import { TERRAIN_KINDS, isLine, minPoints } from "./kinds";

const KINDS = new Set(TERRAIN_KINDS.map((k) => k.kind));

// Only the points that are pairs of numbers
const readPoints = (raw: unknown): PathPoint[] =>
  Array.isArray(raw)
    ? raw
        .filter((p: any) => p && Number.isFinite(p.x) && Number.isFinite(p.y))
        .map((p: any) => ({ x: p.x, y: p.y }))
    : [];

export function parseTerrain(raw: unknown): TerrainFeature[] {
  if (!Array.isArray(raw)) return [];
  const features: TerrainFeature[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry.id !== "string" || !KINDS.has(entry.kind))
      continue;
    const points = readPoints(entry.points);
    if (points.length < minPoints(entry.kind)) continue;
    const feature: TerrainFeature = { id: entry.id, kind: entry.kind, points };
    if (typeof entry.name === "string" && entry.name.trim())
      feature.name = entry.name.trim();
    // only areas have holes, and a hole needs three points
    const holes =
      Array.isArray(entry.holes) && !isLine(entry.kind)
        ? entry.holes
            .map(readPoints)
            .filter((hole: PathPoint[]) => hole.length >= 3)
        : [];
    if (holes.length > 0) feature.holes = holes;
    features.push(feature);
  }
  return features;
}
