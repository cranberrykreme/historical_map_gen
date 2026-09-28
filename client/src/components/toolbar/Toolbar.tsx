import React, { useState } from "react";
import ToolbarTabRail, { ToolbarTab } from "./ToolbarTabRail";
import AssetsPanel from "./AssetsPanel";
import PsdPanel from "./PsdPanel";
import { AssetType, ToolbarTabId } from "../../types";
import styles from "./Toolbar.module.css";

interface ToolbarProps {
  onAddAsset: () => void;
  onPlaceUnit: (filename: string, assetType: AssetType) => void;
  selectedMapFilename: string | null;
  onSelectMap: (filename: string | null) => void;
  onDeleteAsset: (filename: string, assetType: AssetType) => void;
}

const TABS: ToolbarTab[] = [
  { id: "assets", icon: "+", label: "Assets" },
  { id: "psd", icon: "✎", label: "PSD Editor" },
];

function Toolbar({
  onAddAsset,
  onPlaceUnit,
  selectedMapFilename,
  onSelectMap,
  onDeleteAsset,
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
              onPlaceUnit={onPlaceUnit}
              selectedMapFilename={selectedMapFilename}
              onSelectMap={onSelectMap}
              onDeleteAsset={onDeleteAsset}
            />
          )}
          {activeTab === "psd" && <PsdPanel />}
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
