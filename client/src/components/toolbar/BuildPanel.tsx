import React from "react";
import { useMapStore } from "../../store/useMapStore";
import TerrainPatterns from "../terrain/TerrainPatterns";
import TerrainSection from "../terrain/TerrainSection";
import PathsPanel from "./PathsPanel";
import ArmiesPanel from "./ArmiesPanel";
import CollapsibleSection from "./CollapsibleSection";
import styles from "./PathsPanel.module.css";
import { activeBattle, SCENE_KINDS } from "../../utils/scenes/kinds";

// What's in the open scene: its marches and armies, and in a battle its terrain (shapes,
// details, the brush and eraser, and the style). Every section folds away.
function BuildPanel() {
  const openBattle = useMapStore(activeBattle);
  const hasTerrain = SCENE_KINDS[openBattle ? "battle" : "map"].hasTerrain;
  return (
    <div className={styles.panel}>
      <TerrainPatterns style={openBattle?.style} />
      <div className={styles.list}>
        <CollapsibleSection id="group-paths" title="Marches">
          <PathsPanel />
        </CollapsibleSection>
        <CollapsibleSection id="group-armies" title="Armies">
          <ArmiesPanel />
        </CollapsibleSection>
        {hasTerrain && openBattle && <TerrainSection battle={openBattle} />}
      </div>
    </div>
  );
}

export default BuildPanel;
