import React from "react";
import BattlesPanel from "./BattlesPanel";
import PathsPanel from "./PathsPanel";
import ArmiesPanel from "./ArmiesPanel";
import CollapsibleSection from "./CollapsibleSection";
import styles from "./PathsPanel.module.css";

// The scene being edited and what's in it, in one tab: three sections, Battles, Paths and
// Armies, each with its own subsections. Every one of them folds away.
function ScenePanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.list}>
        <CollapsibleSection id="group-battles" title="Battles">
          <BattlesPanel />
        </CollapsibleSection>
        <CollapsibleSection id="group-paths" title="Paths">
          <PathsPanel />
        </CollapsibleSection>
        <CollapsibleSection id="group-armies" title="Armies">
          <ArmiesPanel />
        </CollapsibleSection>
      </div>
    </div>
  );
}

export default ScenePanel;
