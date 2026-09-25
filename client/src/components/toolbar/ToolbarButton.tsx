import React from "react";
import styles from "./ToolbarButton.module.css";

interface ToolbarButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  isExpanded: boolean;
  isActive?: boolean;
}

function ToolbarButton({
  icon,
  label,
  onClick,
  isExpanded,
  isActive = false,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
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
