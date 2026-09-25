import React from "react";

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
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-sm)",
        width: "100%",
        padding: "var(--space-sm)",
        background: isActive ? "var(--color-gold-subtle)" : "transparent",
        border: "none",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        transition: "background var(--toolbar-transition)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--color-surface-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
        }
      }}
    >
      {/* Icon container — always visible */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "var(--radius-full)",
          border: `1px solid ${isActive ? "var(--color-gold)" : "var(--color-border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: isActive ? "var(--color-gold)" : "var(--color-text-dim)",
          fontSize: "16px",
          transition:
            "border-color var(--toolbar-transition), color var(--toolbar-transition)",
        }}
      >
        <span style={{ display: "block", transform: "translateY(-1px)" }}>
          {icon}
        </span>
      </div>

      {/* Label — only visible when expanded */}
      {isExpanded && (
        <span
          style={{
            color: isActive
              ? "var(--color-gold)"
              : "var(--color-text-secondary)",
            fontSize: "var(--font-size-md)",
            fontFamily: "var(--font-ui)",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

export default ToolbarButton;
