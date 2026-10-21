import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMapStore } from "../../store/useMapStore";
import { MAP_SCENE } from "../../types";
import styles from "./ProjectHeader.module.css";
import { activeBattle } from "../../utils/scenes/kinds";

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

interface ProjectHeaderProps {
  projectName: string;
  onSave: () => void;
  onUndo: () => void;
  canUndo: boolean;
  saveStatus: SaveStatus;
}

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  failed: "Save failed",
};

function ProjectHeader({
  projectName,
  onSave,
  onUndo,
  canUndo,
  saveStatus,
}: ProjectHeaderProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  // The open battle, if any: shown all the time, with a way back to the main map
  const battle = useMapStore(activeBattle);
  const switchScene = useMapStore((state) => state.switchScene);

  // Shown even when collapsed, so saving with ⌘S still gets a confirmation
  const showStatus = !isExpanded && saveStatus !== "idle";

  return (
    <div
      className={`${styles.header} ${isExpanded || showStatus || battle ? styles.active : ""}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <button
        className={styles.iconButton}
        onClick={() => navigate("/")}
        title="Back to projects"
      >
        ⌂
      </button>

      {showStatus && (
        <span
          className={`${styles.status} ${saveStatus === "failed" ? styles.statusFailed : ""}`}
        >
          {STATUS_TEXT[saveStatus]}
        </span>
      )}

      {isExpanded && (
        <>
          <span className={styles.projectName}>{projectName}</span>
          <div className={styles.divider} />
          <button
            className={styles.saveButton}
            onClick={onSave}
            disabled={saveStatus === "saving"}
            title="Save (⌘S)"
          >
            {saveStatus === "idle" ? "Save" : STATUS_TEXT[saveStatus]}
          </button>
          <button
            className={styles.iconButton}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
          >
            ↶
          </button>
        </>
      )}

      {battle && (
        <>
          <div className={styles.divider} />
          <span className={styles.battleIcon}>
            {battle.kind === "sea" ? "⚓" : "⚔"}
          </span>
          <span className={styles.battleName} title={battle.name}>
            {battle.name}
          </span>
          <span className={styles.battleKind}>
            {battle.kind === "sea" ? "Sea battle" : "Land battle"}
          </span>
          <button
            className={styles.backButton}
            onClick={() => switchScene(MAP_SCENE)}
            title="Back to the main map"
          >
            ← Main map
          </button>
        </>
      )}
    </div>
  );
}

export default ProjectHeader;
