import React, { useState } from "react";
import ToolbarButton from "./ToolbarButton";
import UnitThumbnailList from "./UnitThumbnailList";
import { useMapStore } from "../../store/useMapStore";
import { AssetType } from "../../types";

interface ToolbarProps {
  onAddAsset: () => void;
  onPlaceUnit: (filename: string, assetType: AssetType) => void;
  selectedMapFilename: string | null;
  onSelectMap: (filename: string | null) => void;
}

function Toolbar({
  onAddAsset,
  onPlaceUnit,
  selectedMapFilename,
  onSelectMap,
}: ToolbarProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const units = useMapStore((state) => state.availableUnits);
  const portraits = useMapStore((state) => state.availablePortraits);
  const maps = useMapStore((state) => state.availableMaps);

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
          maps={maps}
          selectedMapFilename={selectedMapFilename}
          onPlaceUnit={onPlaceUnit}
          onSelectMap={onSelectMap}
        />
      )}
    </div>
  );
}

export default Toolbar;
