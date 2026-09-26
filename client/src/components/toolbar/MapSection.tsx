import React, { useState } from "react";
import styles from "./MapSection.module.css";
import deleteStyles from "./DeleteButton.module.css";

interface MapSectionProps {
  maps: string[];
  selectedMapFilename: string | null;
  onSelectMap: (filename: string | null) => void;
  onDeleteAsset: (filename: string, assetType: "maps") => void;
}

function MapSection({
  maps,
  selectedMapFilename,
  onSelectMap,
  onDeleteAsset,
}: MapSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [hoveredFilename, setHoveredFilename] = useState<string | null>(null);

  if (maps.length === 0) return null;

  return (
    <div className={styles.section}>
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className={styles.header}
      >
        <span>Maps</span>
        <span
          className={`${styles.chevron} ${isCollapsed ? styles.chevronCollapsed : ""}`}
        >
          ▾
        </span>
      </div>
      {!isCollapsed &&
        maps.map((filename) => {
          const isActive = selectedMapFilename === filename;
          const isHovered = hoveredFilename === filename;
          return (
            <div
              key={filename}
              onClick={() => onSelectMap(isActive ? null : filename)}
              onMouseEnter={() => setHoveredFilename(filename)}
              onMouseLeave={() => setHoveredFilename(null)}
              className={`${styles.mapRow} ${isActive ? styles.mapRowActive : ""}`}
            >
              <span
                className={`${styles.filename} ${isActive ? styles.filenameActive : ""}`}
              >
                {filename}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAsset(filename, "maps");
                }}
                title="Delete map"
                className={`${deleteStyles.deleteButton} ${isHovered ? "" : deleteStyles.hidden}`}
              >
                ×
              </button>
            </div>
          );
        })}
    </div>
  );
}

export default MapSection;
