import React from "react";
import { useMapStore } from "../../store/useMapStore";
import TerrainPatterns from "../terrain/TerrainPatterns";
import TerrainSection from "../terrain/TerrainSection";
import styles from "./PathsPanel.module.css";
import { activeBattle } from "../../utils/scenes/kinds";

// Drawing on the open battle's ground: terrain shapes, details, and the freehand brush and
// eraser. Terrain belongs to a battle, so on the main map this only says how to open one.
function DrawingPanel() {
  const openBattle = useMapStore(activeBattle);
  return (
    <div className={styles.panel}>
      <TerrainPatterns style={openBattle?.style} />
      <div className={styles.list}>
        {openBattle ? (
          <TerrainSection battle={openBattle} />
        ) : (
          <p className={styles.emptyMessage}>
            Terrain is drawn on a battle's ground. Open a battle to draw hills,
            woods, rivers and the rest, or to paint with the brush.
          </p>
        )}
      </div>
    </div>
  );
}

export default DrawingPanel;
