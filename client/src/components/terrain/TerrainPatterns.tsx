import React from "react";
import { TerrainStyle } from "../../types";
import { stylePatterns } from "../../utils/terrainStyles";

// The terrain patterns (fields, waves, sand, ...) in a style, for any terrain drawn outside a
// battle's ground, such as the picker's thumbnails. Takes no space on the page.
function TerrainPatterns({ style }: { style?: TerrainStyle }) {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0 }}
      aria-hidden="true"
    >
      <defs dangerouslySetInnerHTML={{ __html: stylePatterns(style) }} />
    </svg>
  );
}

export default TerrainPatterns;
