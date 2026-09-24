import React, { useState } from "react";
import ToolbarButton from "./ToolbarButton";

interface ToolbarProps {
  onAddAsset: () => void;
}

function Toolbar({ onAddAsset }: ToolbarProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: isExpanded
          ? "var(--toolbar-width-expanded)"
          : "var(--toolbar-width-collapsed)",
        background: isExpanded ? "var(--color-surface)" : "transparent",
        borderLeft: isExpanded
          ? "1px solid var(--color-border-subtle)"
          : "none",
        transition: `width var(--toolbar-transition), background var(--toolbar-transition), border var(--toolbar-transition)`,
        display: "flex",
        flexDirection: "column",
        padding: "var(--space-sm)",
        gap: "var(--space-xs)",
        zIndex: 1000,
        boxSizing: "border-box",
      }}
    >
      <ToolbarButton
        icon="+"
        label="Add Asset"
        onClick={onAddAsset}
        isExpanded={isExpanded}
      />
    </div>
  );
}

export default Toolbar;
