// Terrain: each kind's thumbnail picture

import {
  BattleKind,
  PathPoint,
  TerrainFeature,
  TerrainKind,
} from "../../types";
import { kindInfo } from "./kinds";

// The size of a kind's thumbnail picture, in its own units
export const THUMB_WIDTH = 320;
export const THUMB_HEIGHT = 124;

// What a kind's thumbnail shows: the ground it usually sits on, and an example of it (with a
// river under a bridge, so it's clear what it's for)
export function thumbnailFor(kind: TerrainKind): {
  ground: BattleKind;
  features: TerrainFeature[];
} {
  const info = kindInfo(kind);
  const onSea =
    info.group === "Water"
      ? kind !== "lake"
      : kind === "land" || kind === "sand";
  const blob: PathPoint[] = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const wobble = 1 + Math.sin(i * 2.1) * 0.12;
    return {
      x: THUMB_WIDTH / 2 + Math.cos(a) * 125 * wobble,
      y: THUMB_HEIGHT / 2 + Math.sin(a) * 46 * wobble,
    };
  });
  const curve: PathPoint[] = [
    { x: 20, y: 98 },
    { x: 110, y: 34 },
    { x: 210, y: 90 },
    // rivers and streams flow on off the picture, from a source on the left
    kind === "river" || kind === "stream"
      ? { x: 330, y: 22 }
      : { x: 300, y: 28 },
  ];
  const features: TerrainFeature[] =
    kind === "bridge"
      ? [
          {
            id: "thumb-bridge-river",
            kind: "river",
            points: [
              { x: 165, y: 0 },
              { x: 150, y: 62 },
              { x: 168, y: 124 },
            ],
          },
          {
            id: "thumb-bridge",
            kind,
            points: [
              { x: 110, y: 62 },
              { x: 200, y: 62 },
            ],
          },
        ]
      : [
          {
            id: `thumb-${kind}`,
            kind,
            points: info.shape === "line" ? curve : blob,
          },
        ];
  return { ground: onSea ? "sea" : "land", features };
}
