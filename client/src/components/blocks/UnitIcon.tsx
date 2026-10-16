import React from "react";
import API_BASE_URL from "../../config/api";
import { useAssetStore } from "../../store/useAssetStore";
import { Unit } from "../../types";
import BlockShape from "../BlockShape";

// A unit's small picture in the panels' lists: its image, or for a formation block the block
// itself, shrunk to fit
function UnitIcon({ unit, className }: { unit: Unit; className?: string }) {
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  if (unit.block)
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BlockShape block={unit.block} fit={{ width: 28, height: 28 }} />
      </span>
    );
  return (
    <img
      src={`${API_BASE_URL}/api/projects/${currentProjectName}/assets/${unit.assetType}/${unit.path ?? unit.filename}`}
      alt={unit.filename}
      className={className}
      draggable={false}
    />
  );
}

export default UnitIcon;
