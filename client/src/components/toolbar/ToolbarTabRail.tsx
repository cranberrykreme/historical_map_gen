import React from "react";
import ToolbarButton from "./ToolbarButton";
import { ToolbarTabId } from "../../types";
import styles from "./ToolbarTabRail.module.css";

export interface ToolbarTab {
  id: ToolbarTabId;
  icon: string;
  label: string;
}

interface ToolbarTabRailProps {
  tabs: ToolbarTab[];
  activeTab: ToolbarTabId | null;
  onSelectTab: (id: ToolbarTabId) => void;
}

function ToolbarTabRail({ tabs, activeTab, onSelectTab }: ToolbarTabRailProps) {
  return (
    <div className={styles.rail}>
      {tabs.map((tab) => (
        <div key={tab.id} onMouseEnter={() => onSelectTab(tab.id)}>
          <ToolbarButton
            icon={tab.icon}
            label={tab.label}
            onClick={() => onSelectTab(tab.id)}
            isExpanded={false}
            isActive={activeTab === tab.id}
          />
        </div>
      ))}
    </div>
  );
}

export default ToolbarTabRail;
