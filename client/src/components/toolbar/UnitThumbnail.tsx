import React, { useState } from "react";
import API_BASE_URL from "../../config/api";
import { AssetType } from "../../types";
import styles from "./UnitThumbnail.module.css";
import deleteStyles from "./DeleteButton.module.css";
import { useAssetStore } from "../../store/useAssetStore";

interface UnitThumbnailProps {
  filename: string;
  assetType: AssetType;
  onClick: () => void;
  onDelete: () => void;
}

function UnitThumbnail({
  filename,
  assetType,
  onClick,
  onDelete,
}: UnitThumbnailProps) {
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ filename, assetType })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={styles.thumbnail}
    >
      <img
        src={`${API_BASE_URL}/api/projects/${currentProjectName}/assets/${assetType}/${filename}`}
        alt={filename}
        className={styles.image}
        draggable={false}
      />
      <span className={styles.filename}>{filename}</span>
      <button
        onClick={handleDeleteClick}
        title="Delete asset"
        className={`${deleteStyles.deleteButton} ${isHovered ? "" : deleteStyles.hidden}`}
      >
        ×
      </button>
    </div>
  );
}

export default UnitThumbnail;
