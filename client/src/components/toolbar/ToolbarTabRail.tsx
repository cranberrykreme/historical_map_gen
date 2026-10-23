import React from "react";
import { ToolbarTabId } from "../../types";
import styles from "./ToolbarTabRail.module.css";

export interface ToolbarTab {
  id: ToolbarTabId;
  icon: string;
  word: string; // the short name under the icon
  hint: string; // shown on hover
}

interface ToolbarTabRailProps {
  tabs: ToolbarTab[];
  activeTab: ToolbarTabId | null;
  onClickTab: (id: ToolbarTabId) => void;
}

// The tabs down the right edge, each an icon with its name underneath. Hovering only shows
// what the tab holds; a click opens it.
function ToolbarTabRail({ tabs, activeTab, onClickTab }: ToolbarTabRailProps) {
  return (
    <div className={styles.rail}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`${styles.tab} ${active ? styles.tabActive : ""}`}
            onClick={() => onClickTab(tab.id)}
            title={active ? `${tab.hint} (click to close)` : tab.hint}
          >
            <span className={styles.icon}>{tab.icon}</span>
            <span className={styles.word}>{tab.word}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ToolbarTabRail;
