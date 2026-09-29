import React from "react";
import ToolbarButton from "./ToolbarButton";
import AssetSection from "./AssetSection";
import MapSection from "./MapSection";
import { AssetType } from "../../types";
import { useAssetStore } from "../../store/useAssetStore";
import styles from "./AssetsPanel.module.css";

interface AssetsPanelProps {
  onAddAsset: () => void;
  selectedMapFilename: string | null;
  onSelectMap: (filename: string | null) => void;
  onDeleteAsset: (path: string, assetType: AssetType) => void;
  onAssetRenamed: (
    oldPath: string,
    newPath: string,
    assetType: AssetType
  ) => void;
}

function AssetsPanel({
  onAddAsset,
  selectedMapFilename,
  onSelectMap,
  onDeleteAsset,
  onAssetRenamed,
}: AssetsPanelProps) {
  const units = useAssetStore((state) => state.units);
  const portraits = useAssetStore((state) => state.portraits);
  const maps = useAssetStore((state) => state.maps);
  const createFolder = useAssetStore((state) => state.createFolder);
  const renameOrMoveAsset = useAssetStore((state) => state.renameOrMoveAsset);

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
          files={units.files}
          folders={units.folders}
          onDeleteAsset={onDeleteAsset}
          onCreateFolder={(name) => createFolder("units", name)}
          onMoveAsset={(path, folder) =>
            renameOrMoveAsset(path, "units", { folder }, onAssetRenamed)
          }
          onRenameAsset={(path, filename, folder) =>
            renameOrMoveAsset(
              path,
              "units",
              { filename, folder: folder ?? "" },
              onAssetRenamed
            )
          }
        />
        <AssetSection
          title="Portraits"
          assetType="portraits"
          files={portraits.files}
          folders={portraits.folders}
          onDeleteAsset={onDeleteAsset}
          onCreateFolder={(name) => createFolder("portraits", name)}
          onMoveAsset={(path, folder) =>
            renameOrMoveAsset(path, "portraits", { folder }, onAssetRenamed)
          }
          onRenameAsset={(path, filename, folder) =>
            renameOrMoveAsset(
              path,
              "portraits",
              { filename, folder: folder ?? "" },
              onAssetRenamed
            )
          }
        />
        <MapSection
          maps={maps.files}
          selectedMapFilename={selectedMapFilename}
          onSelectMap={onSelectMap}
          onDeleteAsset={onDeleteAsset}
        />
      </div>
    </div>
  );
}

export default AssetsPanel;
