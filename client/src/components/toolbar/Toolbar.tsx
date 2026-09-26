import React, { useState } from "react";
import ToolbarButton from "./ToolbarButton";
import AssetSection from "./AssetSection";
import MapSection from "./MapSection";
import { AssetType } from "../../types";
import styles from "./Toolbar.module.css";
import { useAssetStore } from "../../store/useAssetStore";

interface ToolbarProps {
  onAddAsset: () => void;
  onPlaceUnit: (filename: string, assetType: AssetType) => void;
  selectedMapFilename: string | null;
  onSelectMap: (filename: string | null) => void;
  onDeleteAsset: (filename: string, assetType: AssetType) => void;
}

function Toolbar({
  onAddAsset,
  onPlaceUnit,
  selectedMapFilename,
  onSelectMap,
  onDeleteAsset,
}: ToolbarProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const units = useAssetStore((state) => state.availableUnits);
  const portraits = useAssetStore((state) => state.availablePortraits);
  const maps = useAssetStore((state) => state.availableMaps);

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`${styles.toolbar} ${isExpanded ? styles.toolbarExpanded : ""}`}
    >
      <ToolbarButton
        icon="+"
        label="Add Asset"
        onClick={onAddAsset}
        isExpanded={isExpanded}
      />

      {isExpanded && (
        <div className={styles.sectionList}>
          <AssetSection
            title="Units"
            assetType="units"
            files={units}
            onPlaceUnit={onPlaceUnit}
            onDeleteAsset={onDeleteAsset}
          />
          <AssetSection
            title="Portraits"
            assetType="portraits"
            files={portraits}
            onPlaceUnit={onPlaceUnit}
            onDeleteAsset={onDeleteAsset}
          />
          <MapSection
            maps={maps}
            selectedMapFilename={selectedMapFilename}
            onSelectMap={onSelectMap}
            onDeleteAsset={onDeleteAsset}
          />
        </div>
      )}
    </div>
  );
}

export default Toolbar;
