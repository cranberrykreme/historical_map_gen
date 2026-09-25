import React from "react";
import UnitThumbnail from "./UnitThumbnail";
import { AssetType } from "../../types";

interface UnitThumbnailListProps {
  units: string[];
  portraits: string[];
  maps: string[];
  selectedMapFilename: string | null;
  onPlaceUnit: (filename: string, assetType: AssetType) => void;
  onSelectMap: (filename: string | null) => void;
}

function UnitThumbnailList({
  units,
  portraits,
  maps,
  selectedMapFilename,
  onPlaceUnit,
  onSelectMap,
}: UnitThumbnailListProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        overflowY: "auto",
        marginTop: "var(--space-md)",
      }}
    >
      {units.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-xs)",
          }}
        >
          <span
            style={{
              color: "var(--color-gold-dim)",
              fontSize: "var(--font-size-sm)",
              fontFamily: "var(--font-ui)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "0 var(--space-sm)",
            }}
          >
            Units
          </span>
          {units.map((filename) => (
            <UnitThumbnail
              key={filename}
              filename={filename}
              assetType="units"
              onClick={() => onPlaceUnit(filename, "units")}
            />
          ))}
        </div>
      )}

      {portraits.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-xs)",
          }}
        >
          <span
            style={{
              color: "var(--color-gold-dim)",
              fontSize: "var(--font-size-sm)",
              fontFamily: "var(--font-ui)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "0 var(--space-sm)",
            }}
          >
            Portraits
          </span>
          {portraits.map((filename) => (
            <UnitThumbnail
              key={filename}
              filename={filename}
              assetType="portraits"
              onClick={() => onPlaceUnit(filename, "portraits")}
            />
          ))}
        </div>
      )}

      {maps.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-xs)",
          }}
        >
          <span
            style={{
              color: "var(--color-gold-dim)",
              fontSize: "var(--font-size-sm)",
              fontFamily: "var(--font-ui)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "0 var(--space-sm)",
            }}
          >
            Maps
          </span>
          {maps.map((filename) => (
            <div
              key={filename}
              onClick={() =>
                onSelectMap(selectedMapFilename === filename ? null : filename)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                background:
                  selectedMapFilename === filename
                    ? "var(--color-gold-subtle)"
                    : "transparent",
                transition: "background var(--toolbar-transition)",
              }}
              onMouseEnter={(e) => {
                if (selectedMapFilename !== filename) {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "var(--color-surface-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedMapFilename !== filename) {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "transparent";
                }
              }}
            >
              <span
                style={{
                  color:
                    selectedMapFilename === filename
                      ? "var(--color-gold)"
                      : "var(--color-text-secondary)",
                  fontSize: "var(--font-size-sm)",
                  fontFamily: "var(--font-ui)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {filename}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UnitThumbnailList;
