import React from "react";
import ToolbarButton from "./ToolbarButton";
import AssetSection from "./AssetSection";
import MapSection from "./MapSection";
import { AssetType } from "../../types";
import { useAssetStore } from "../../store/useAssetStore";
import styles from "./AssetsPanel.module.css";

interface AssetsPanelProps {
  onAddAsset: () => void;
  onPlaceUnit: (filename: string, assetType: AssetType) => void;
  selectedMapFilename: string | null;
  onSelectMap: (filename: string | null) => void;
  onDeleteAsset: (filename: string, assetType: AssetType) => void;
}

function AssetsPanel({
  onAddAsset,
  onPlaceUnit,
  selectedMapFilename,
  onSelectMap,
  onDeleteAsset,
}: AssetsPanelProps) {
  const units = useAssetStore((state) => state.availableUnits);
  const portraits = useAssetStore((state) => state.availablePortraits);
  const maps = useAssetStore((state) => state.availableMaps);

  return (
    <div className={styles.panel}>
      <ToolbarButton
        icon="+"
        label="Add Asset"
        onClick={onAddAsset}
        isExpanded={true}
      />

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
    </div>
  );
}

export default AssetsPanel;
