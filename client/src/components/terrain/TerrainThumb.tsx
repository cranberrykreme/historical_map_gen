import React, { useId, useMemo } from "react";
import { TerrainKind } from "../../types";
import {
  GROUND_COLOUR,
  THUMB_HEIGHT,
  THUMB_WIDTH,
  thumbnailFor,
} from "../../utils/terrain";
import { battleStrokes } from "../../utils/terrainScene";
import { safeId, TerrainStrokes } from "./terrainShapes";

// A picture of a terrain kind, drawn exactly as it looks on the battlefield. The patterns it
// uses come from TerrainPatterns, which must be on the page.
function TerrainThumb({
  kind,
  height = 44,
}: {
  kind: TerrainKind;
  height?: number;
}) {
  const prefix = `th${safeId(useId())}`;
  const { ground, strokes } = useMemo(() => {
    const { ground, features } = thumbnailFor(kind);
    return {
      ground,
      strokes: battleStrokes(features, ground, THUMB_WIDTH, THUMB_HEIGHT),
    };
  }, [kind]);
  return (
    <svg
      viewBox={`0 0 ${THUMB_WIDTH} ${THUMB_HEIGHT}`}
      width="100%"
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", borderRadius: 3, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <rect
        width={THUMB_WIDTH}
        height={THUMB_HEIGHT}
        fill={GROUND_COLOUR[ground]}
      />
      <TerrainStrokes strokes={strokes} idPrefix={prefix} />
    </svg>
  );
}

export default TerrainThumb;
