import React from "react";
import { TerrainKind } from "../../types";
import { isLine } from "../../utils/terrain";
import { FeatureDrawing } from "./terrainShapes";

// A small patch of a terrain kind for lists: its colour and texture filling the patch, or a
// short straight piece of a line. The patterns it uses come from TerrainPatterns.
function TerrainSwatch({ kind }: { kind: TerrainKind }) {
  const line = isLine(kind);
  // Lines are wide, so they're shown from further out
  const [w, h] = line ? [100, 46] : [68, 32];
  const points = line
    ? [
        { x: -10, y: h / 2 },
        { x: w + 10, y: h / 2 },
      ]
    : [
        { x: -20, y: -20 },
        { x: w + 20, y: -20 },
        { x: w + 20, y: h + 20 },
        { x: -20, y: h + 20 },
      ];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={34}
      height={16}
      preserveAspectRatio="xMidYMid slice"
      style={{
        display: "block",
        borderRadius: 3,
        flexShrink: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <rect width={w} height={h} fill={line ? "#8fae62" : "none"} />
      <FeatureDrawing feature={{ id: `swatch-${kind}`, kind, points }} />
    </svg>
  );
}

export default TerrainSwatch;
