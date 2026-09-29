import React, { useState } from "react";
import API_BASE_URL from "../../config/api";
import { AssetType } from "../../types";
import styles from "./UnitThumbnail.module.css";
import deleteStyles from "./DeleteButton.module.css";
import { useAssetStore } from "../../store/useAssetStore";

interface UnitThumbnailProps {
  path: string;
  filename: string;
  assetType: AssetType;
  onDelete: () => void;
  onRename: (newFilename: string) => void;
}

function UnitThumbnail({
  path,
  filename,
  assetType,
  onDelete,
  onRename,
}: UnitThumbnailProps) {
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  const extensionMatch = filename.match(/\.[^/.]+$/);
  const extension = extensionMatch ? extensionMatch[0] : "";
  const displayName = extension
    ? filename.slice(0, -extension.length)
    : filename;

  const [renameValue, setRenameValue] = useState<string>(displayName);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ path, assetType })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleNameDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(displayName);
    setIsRenaming(true);
  };

  const commitRename = () => {
    setIsRenaming(false);
    const trimmed = renameValue.trim();
    const newFilename = `${trimmed}${extension}`;
    if (trimmed && newFilename !== filename) {
      onRename(newFilename);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={styles.thumbnail}
    >
      <img
        src={`${API_BASE_URL}/api/projects/${currentProjectName}/assets/${assetType}/${path}`}
        alt={filename}
        className={styles.image}
        draggable={false}
      />
      {isRenaming ? (
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          className={styles.renameInput}
        />
      ) : (
        <span className={styles.filename} onDoubleClick={handleNameDoubleClick}>
          {displayName}
        </span>
      )}
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
