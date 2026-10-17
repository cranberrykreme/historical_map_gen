import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { TerrainStyle } from "../../types";
import {
  DEFAULT_TERRAIN_STYLE,
  TERRAIN_STYLES,
} from "../../utils/terrainStyles";
import TerrainStylePreview from "./TerrainStylePreview";
import styles from "./AddTerrainDialog.module.css";

// Every terrain style as a big picture of the same little battlefield, with its name and
// what it looks like. Picking one sets the battle's style; the one it has now is outlined.
function TerrainStyleDialog({
  battleName,
  current = DEFAULT_TERRAIN_STYLE,
  onPick,
  onClose,
}: {
  battleName: string;
  current?: TerrainStyle;
  onPick: (style: TerrainStyle) => void;
  onClose: () => void;
}) {
  // Esc closes it, before anything else on the page sees the key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-label={`Terrain style for ${battleName}`}
      >
        <div className={styles.header}>
          <span className={styles.title}>Terrain style: {battleName}</span>
          <button
            className={styles.close}
            onClick={onClose}
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.grid}>
            {TERRAIN_STYLES.map(({ id, label, hint }) => (
              <button
                key={id}
                className={`${styles.tile} ${id === current ? styles.current : ""}`}
                title={hint}
                onClick={() => onPick(id)}
              >
                <TerrainStylePreview style={id} height={86} />
                <span className={styles.name}>{label}</span>
                <span className={styles.hint}>{hint}</span>
              </button>
            ))}
          </div>
        </div>
        <p className={styles.footer}>
          The style changes how the whole battlefield looks, in the editor and
          in the video. Each battle has its own, and the terrain stays as it is,
          so you can switch back at any time.
        </p>
      </div>
    </div>,
    document.body
  );
}

export default TerrainStyleDialog;
