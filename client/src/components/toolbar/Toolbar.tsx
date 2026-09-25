import React, { useState } from "react";
import ToolbarButton from "./ToolbarButton";
import UnitThumbnailList from "./UnitThumbnailList";
import useAssetList from "../../hooks/useAssetList";
import { AssetType } from "../../types";

interface ToolbarProps {
  onAddAsset: () => void;
  onPlaceUnit: (filename: string, assetType: AssetType) => void;
}

function Toolbar({ onAddAsset, onPlaceUnit }: ToolbarProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { assets: units } = useAssetList("units");
  const { assets: portraits } = useAssetList("portraits");

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{
        position: "fixed",
        top: 0,
        right: isExpanded ? 0 : "8px",
        height: "100vh",
        width: isExpanded
          ? "var(--toolbar-width-expanded)"
          : "var(--toolbar-width-collapsed)",
        background: isExpanded ? "var(--color-surface)" : "transparent",
        borderLeft: isExpanded
          ? "1px solid var(--color-border-subtle)"
          : "none",
        transition: `width var(--toolbar-transition), background var(--toolbar-transition), border var(--toolbar-transition), right var(--toolbar-transition)`,
        display: "flex",
        flexDirection: "column",
        padding: "var(--space-sm)",
        gap: "var(--space-xs)",
        zIndex: 1000,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <ToolbarButton
        icon="+"
        label="Add Asset"
        onClick={onAddAsset}
        isExpanded={isExpanded}
      />

      {isExpanded && (
        <UnitThumbnailList
          units={units}
          portraits={portraits}
          onPlaceUnit={onPlaceUnit}
        />
      )}
    </div>
  );
}

export default Toolbar;
