import React, { useState } from "react";
import API_BASE_URL from "../../config/api";
import { AssetType } from "../../types";

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
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-sm)",
        padding: "var(--space-sm)",
        borderRadius: "var(--radius-sm)",
        cursor: "grab",
        background: isHovered ? "var(--color-surface-hover)" : "transparent",
        transition: "background var(--toolbar-transition)",
      }}
    >
      <img
        src={`${API_BASE_URL}/api/assets/${assetType}/${filename}`}
        alt={filename}
        style={{
          width: "32px",
          height: "32px",
          objectFit: "contain",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-border)",
        }}
        draggable={false}
      />
      <span
        style={{
          flex: 1,
          color: "var(--color-text-secondary)",
          fontSize: "var(--font-size-sm)",
          fontFamily: "var(--font-ui)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {filename}
      </span>
      {isHovered && (
        <button
          onClick={handleDeleteClick}
          title="Delete asset"
          style={{
            width: "18px",
            height: "18px",
            flexShrink: 0,
            borderRadius: "var(--radius-full)",
            border: "1px solid #6a3030",
            background: "transparent",
            color: "#e07070",
            fontSize: "11px",
            lineHeight: "1",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition:
              "background var(--toolbar-transition), border-color var(--toolbar-transition)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(224, 112, 112, 0.15)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "#e07070";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "#6a3030";
          }}
        >
          <span style={{ display: "block", transform: "translateY(-1px)" }}>
            ×
          </span>
        </button>
      )}
    </div>
  );
}

export default UnitThumbnail;
