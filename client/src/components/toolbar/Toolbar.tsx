import React, { useState } from "react";
import ToolbarTabRail, { ToolbarTab } from "./ToolbarTabRail";
import AssetsPanel from "./AssetsPanel";
import PsdPanel from "./PsdPanel";
import PortraitPanel from "./PortraitPanel";
import { AssetType, ToolbarTabId } from "../../types";
import styles from "./Toolbar.module.css";

interface ToolbarProps {
  onAddAsset: () => void;
  selectedMapFilename: string | null;
  onSelectMap: (filename: string | null) => void;
  onDeleteAsset: (path: string, assetType: AssetType) => void;
  onAssetRenamed: (
    oldPath: string,
    newPath: string,
    assetType: AssetType
  ) => void;
  onSelectPsd: (name: string) => void;
  onSelectPortraitSource: (filename: string) => void;
}

const TABS: ToolbarTab[] = [
  { id: "assets", icon: "+", label: "Assets" },
  { id: "psd", icon: "✎", label: "PSD Editor" },
  { id: "portrait", icon: "◎", label: "Portrait Maker" },
];

function Toolbar({
  onAddAsset,
  selectedMapFilename,
  onSelectMap,
  onDeleteAsset,
  onAssetRenamed,
  onSelectPsd,
  onSelectPortraitSource,
}: ToolbarProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ToolbarTabId>("assets");

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`${styles.toolbar} ${isExpanded ? styles.toolbarExpanded : ""}`}
    >
      {isExpanded && (
        <div className={styles.panelArea}>
          {activeTab === "assets" && (
            <AssetsPanel
              onAddAsset={onAddAsset}
              selectedMapFilename={selectedMapFilename}
              onSelectMap={onSelectMap}
              onDeleteAsset={onDeleteAsset}
              onAssetRenamed={onAssetRenamed}
            />
          )}
          {activeTab === "psd" && <PsdPanel onSelectPsd={onSelectPsd} />}
          {activeTab === "portrait" && (
            <PortraitPanel onSelectSource={onSelectPortraitSource} />
          )}
        </div>
      )}

      <ToolbarTabRail
        tabs={TABS}
        activeTab={isExpanded ? activeTab : null}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}

export default Toolbar;
