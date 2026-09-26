import React from "react";
import API_BASE_URL from "../../config/api";
import { AssetType } from "../../types";
import styles from "./UnitThumbnail.module.css";

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
      className={styles.thumbnail}
    >
      <img
        src={`${API_BASE_URL}/api/assets/${assetType}/${filename}`}
        alt={filename}
        className={styles.image}
        draggable={false}
      />
      <span className={styles.filename}>{filename}</span>
      <button
        onClick={handleDeleteClick}
        title="Delete asset"
        className={styles.deleteButton}
      >
        <span className={styles.deleteIconInner}>×</span>
      </button>
    </div>
  );
}

export default UnitThumbnail;
