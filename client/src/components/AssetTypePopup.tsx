import React from "react";
import { AssetType } from "../types";

interface AssetTypePopupProps {
  file: File | null;
  onConfirm: (file: File, type: AssetType) => void;
  onCancel: () => void;
}

function AssetTypePopup({ file, onConfirm, onCancel }: AssetTypePopupProps) {
  if (!file) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-lg)",
          width: "320px",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
        }}
      >
        <h2
          style={{
            color: "var(--color-gold)",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--font-size-lg)",
            margin: 0,
          }}
        >
          Add Asset
        </h2>

        <p
          style={{
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--font-size-md)",
            margin: 0,
          }}
        >
          {file.name}
        </p>

        <p
          style={{
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--font-size-md)",
            margin: 0,
          }}
        >
          What type of asset is this?
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          {(["units", "portraits", "maps"] as AssetType[]).map((type) => (
            <button
              key={type}
              onClick={() => onConfirm(file, type)}
              style={{
                padding: "var(--space-sm) var(--space-md)",
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-ui)",
                fontSize: "var(--font-size-md)",
                cursor: "pointer",
                textAlign: "left",
                textTransform: "capitalize",
                transition:
                  "border-color var(--toolbar-transition), background var(--toolbar-transition)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--color-gold)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--color-gold-subtle)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--color-border)";
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--color-surface-raised)";
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          style={{
            padding: "var(--space-sm) var(--space-md)",
            background: "transparent",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text-dim)",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--font-size-md)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AssetTypePopup;
