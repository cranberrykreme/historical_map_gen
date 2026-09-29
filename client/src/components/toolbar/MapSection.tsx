import React, { useState } from "react";
import { AssetFile } from "../../types";
import styles from "./MapSection.module.css";
import deleteStyles from "./DeleteButton.module.css";

interface MapSectionProps {
  maps: AssetFile[];
  selectedMapFilename: string | null;
  onSelectMap: (filename: string | null) => void;
  onDeleteAsset: (path: string, assetType: "maps") => void;
}

function MapSection({
  maps,
  selectedMapFilename,
  onSelectMap,
  onDeleteAsset,
}: MapSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

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
        maps.map((map) => {
          const isActive = selectedMapFilename === map.filename;
          const isHovered = hoveredPath === map.path;
          return (
            <div
              key={map.path}
              onClick={() => onSelectMap(isActive ? null : map.filename)}
              onMouseEnter={() => setHoveredPath(map.path)}
              onMouseLeave={() => setHoveredPath(null)}
              className={`${styles.mapRow} ${isActive ? styles.mapRowActive : ""}`}
            >
              <span
                className={`${styles.filename} ${isActive ? styles.filenameActive : ""}`}
              >
                {map.filename}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAsset(map.path, "maps");
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
