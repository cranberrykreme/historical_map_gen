import React from "react";
import { TerrainKind, TerrainStyle } from "../../types";
import { isLine } from "../../utils/terrain";
import { styleGround } from "../../utils/terrainStyles";
import { FeatureDrawing } from "./terrainShapes";

// A small patch of a terrain kind for lists: its colour and texture filling the patch, or a
// short straight piece of a line, in the battle's style. The patterns it uses come from
// TerrainPatterns (in the same style).
function TerrainSwatch({
  kind,
  style,
}: {
  kind: TerrainKind;
  style?: TerrainStyle;
}) {
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
      <rect
        width={w}
        height={h}
        fill={line ? styleGround("land", style) : "none"}
      />
      <FeatureDrawing
        feature={{ id: `swatch-${kind}`, kind, points }}
        style={style}
      />
    </svg>
  );
}

export default TerrainSwatch;
