import React from "react";
import API_BASE_URL from "../../config/api";
import { AssetType } from "../../types";

interface UnitThumbnailProps {
  filename: string;
  assetType: AssetType;
  onClick: () => void;
}

function UnitThumbnail({ filename, assetType, onClick }: UnitThumbnailProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ filename, assetType })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-sm)",
        padding: "var(--space-sm)",
        borderRadius: "var(--radius-sm)",
        cursor: "grab",
        transition: "background var(--toolbar-transition)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background =
          "var(--color-surface-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
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
    </div>
  );
}

export default UnitThumbnail;
