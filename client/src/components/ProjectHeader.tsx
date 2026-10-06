import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProjectHeader.module.css";

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

  // Shown even when collapsed, so saving with ⌘S still gets a confirmation
  const showStatus = !isExpanded && saveStatus !== "idle";

  return (
    <div
      className={`${styles.header} ${isExpanded || showStatus ? styles.active : ""}`}
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
    </div>
  );
}

export default ProjectHeader;
