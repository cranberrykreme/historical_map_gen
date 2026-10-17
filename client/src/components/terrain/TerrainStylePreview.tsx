import React, { useId, useMemo } from "react";
import { TerrainStyle } from "../../types";
import { TerrainStroke } from "../../utils/terrain";
import { battleStrokes, styleBattle } from "../../utils/terrainScene";
import {
  STYLE_SAMPLE,
  STYLE_SAMPLE_HEIGHT,
  STYLE_SAMPLE_WIDTH,
  styleGround,
  stylePatterns,
} from "../../utils/terrainStyles";
import { safeId, TerrainStrokes } from "./terrainShapes";

// The sample battlefield, worked out once and then put in each style
let sample: TerrainStroke[] | null = null;
const sampleStrokes = () => {
  if (!sample)
    sample = battleStrokes(
      STYLE_SAMPLE,
      "land",
      STYLE_SAMPLE_WIDTH,
      STYLE_SAMPLE_HEIGHT
    );
  return sample;
};

// A little battlefield (a hill, a wood, a river, a village) drawn in a terrain style, with the
// style's own patterns
function TerrainStylePreview({
  style,
  height = 44,
}: {
  style?: TerrainStyle;
  height?: number;
}) {
  const prefix = `sp${safeId(useId())}`;
  const strokes = useMemo(
    () =>
      styleBattle(
        sampleStrokes(),
        STYLE_SAMPLE,
        STYLE_SAMPLE_WIDTH,
        STYLE_SAMPLE_HEIGHT,
        style
      ),
    [style]
  );
  return (
    <svg
      viewBox={`0 0 ${STYLE_SAMPLE_WIDTH} ${STYLE_SAMPLE_HEIGHT}`}
      width="100%"
      height={height}
      preserveAspectRatio="xMidYMid slice"
      style={{ display: "block", borderRadius: 3, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs dangerouslySetInnerHTML={{ __html: stylePatterns(style) }} />
      <rect
        width={STYLE_SAMPLE_WIDTH}
        height={STYLE_SAMPLE_HEIGHT}
        fill={styleGround("land", style)}
      />
      <TerrainStrokes strokes={strokes} idPrefix={prefix} />
    </svg>
  );
}

export default TerrainStylePreview;
