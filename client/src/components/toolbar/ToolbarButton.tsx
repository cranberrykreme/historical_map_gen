import React from "react";
import styles from "./ToolbarButton.module.css";

interface ToolbarButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  isExpanded: boolean;
  isActive?: boolean;
  disabled?: boolean;
  hint?: string; // shown on hover; the label is used when there's none
}

function ToolbarButton({
  icon,
  label,
  onClick,
  isExpanded,
  isActive = false,
  disabled = false,
  hint,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={hint ?? label}
      className={`${styles.button} ${isActive ? styles.buttonActive : ""}`}
    >
      <div
        className={`${styles.iconCircle} ${isActive ? styles.iconCircleActive : ""}`}
      >
        <span className={styles.iconInner}>{icon}</span>
      </div>

      {isExpanded && (
        <span
          className={`${styles.label} ${isActive ? styles.labelActive : ""}`}
        >
          {label}
        </span>
      )}
    </button>
  );
}

export default ToolbarButton;
