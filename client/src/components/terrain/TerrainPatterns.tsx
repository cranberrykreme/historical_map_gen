import React from "react";
import { TERRAIN_PATTERNS } from "../../utils/terrain";

// The terrain patterns (trees, waves, roofs, ...) for any terrain drawn outside a battle's
// ground, such as the picker's thumbnails. Takes no space on the page.
function TerrainPatterns() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0 }}
      aria-hidden="true"
    >
      <defs dangerouslySetInnerHTML={{ __html: TERRAIN_PATTERNS }} />
    </svg>
  );
}

export default TerrainPatterns;
