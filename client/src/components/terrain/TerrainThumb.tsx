import React, { useId, useMemo } from "react";
import { TerrainKind, TerrainStyle } from "../../types";
import { THUMB_HEIGHT, THUMB_WIDTH, thumbnailFor } from "../../utils/terrain/terrain";
import { battleStrokes, styleBattle } from "../../utils/terrain/terrainScene";
import { styleGround } from "../../utils/terrain/terrainStyles";
import { safeId, TerrainStrokes } from "./terrainShapes";

// A picture of a terrain kind, drawn exactly as it looks on the battlefield in the battle's
// style. The patterns it uses come from TerrainPatterns (in the same style), which must be on
// the page.
function TerrainThumb({
  kind,
  height = 44,
  style,
}: {
  kind: TerrainKind;
  height?: number;
  style?: TerrainStyle;
}) {
  const prefix = `th${safeId(useId())}`;
  const { ground, strokes } = useMemo(() => {
    const { ground, features } = thumbnailFor(kind);
    return {
      ground,
      strokes: styleBattle(
        battleStrokes(features, ground, THUMB_WIDTH, THUMB_HEIGHT),
        features,
        THUMB_WIDTH,
        THUMB_HEIGHT,
        style
      ),
    };
  }, [kind, style]);
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
        fill={styleGround(ground, style)}
      />
      <TerrainStrokes strokes={strokes} idPrefix={prefix} />
    </svg>
  );
}

export default TerrainThumb;
