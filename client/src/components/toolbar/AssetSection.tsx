import React, { useState } from "react";
import UnitThumbnail from "./UnitThumbnail";
import { AssetType } from "../../types";
import styles from "./AssetSection.module.css";

interface AssetSectionProps {
  title: string;
  assetType: AssetType;
  files: string[];
  onPlaceUnit: (filename: string, assetType: AssetType) => void;
  onDeleteAsset: (filename: string, assetType: AssetType) => void;
}

function AssetSection({
  title,
  assetType,
  files,
  onPlaceUnit,
  onDeleteAsset,
}: AssetSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  if (files.length === 0) return null;

  return (
    <div className={styles.section}>
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className={styles.header}
      >
        <span>{title}</span>
        <span
          className={`${styles.chevron} ${isCollapsed ? styles.chevronCollapsed : ""}`}
        >
          ▾
        </span>
      </div>
      {!isCollapsed &&
        files.map((filename) => (
          <UnitThumbnail
            key={filename}
            filename={filename}
            assetType={assetType}
            onClick={() => onPlaceUnit(filename, assetType)}
            onDelete={() => onDeleteAsset(filename, assetType)}
          />
        ))}
    </div>
  );
}

export default AssetSection;
