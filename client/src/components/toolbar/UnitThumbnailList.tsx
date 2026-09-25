import React, { useState } from "react";
import UnitThumbnail from "./UnitThumbnail";
import { AssetType } from "../../types";

interface UnitThumbnailListProps {
  units: string[];
  portraits: string[];
  maps: string[];
  selectedMapFilename: string | null;
  onPlaceUnit: (filename: string, assetType: AssetType) => void;
  onSelectMap: (filename: string | null) => void;
  onDeleteAsset: (filename: string, assetType: AssetType) => void;
}

function UnitThumbnailList({
  units,
  portraits,
  maps,
  selectedMapFilename,
  onPlaceUnit,
  onSelectMap,
  onDeleteAsset,
}: UnitThumbnailListProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const sectionHeaderStyle = (section: string): React.CSSProperties => ({
    color: "var(--color-gold-dim)",
    fontSize: "var(--font-size-sm)",
    fontFamily: "var(--font-ui)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "var(--space-xs) var(--space-sm)",
    cursor: "pointer",
    borderRadius: "var(--radius-sm)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "background var(--toolbar-transition)",
  });

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
          <div
            onClick={() => toggleSection("units")}
            style={sectionHeaderStyle("units")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-surface-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span>Units</span>
            <span
              style={{
                transform: collapsedSections.has("units")
                  ? "rotate(-90deg)"
                  : "rotate(0deg)",
                transition: "transform var(--toolbar-transition)",
              }}
            >
              ▾
            </span>
          </div>
          {!collapsedSections.has("units") &&
            units.map((filename) => (
              <UnitThumbnail
                key={filename}
                filename={filename}
                assetType="units"
                onClick={() => onPlaceUnit(filename, "units")}
                onDelete={() => onDeleteAsset(filename, "units")}
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
          <div
            onClick={() => toggleSection("portraits")}
            style={sectionHeaderStyle("portraits")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-surface-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span>Portraits</span>
            <span
              style={{
                transform: collapsedSections.has("portraits")
                  ? "rotate(-90deg)"
                  : "rotate(0deg)",
                transition: "transform var(--toolbar-transition)",
              }}
            >
              ▾
            </span>
          </div>
          {!collapsedSections.has("portraits") &&
            portraits.map((filename) => (
              <UnitThumbnail
                key={filename}
                filename={filename}
                assetType="portraits"
                onClick={() => onPlaceUnit(filename, "portraits")}
                onDelete={() => onDeleteAsset(filename, "portraits")}
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
          <div
            onClick={() => toggleSection("maps")}
            style={sectionHeaderStyle("maps")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-surface-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span>Maps</span>
            <span
              style={{
                transform: collapsedSections.has("maps")
                  ? "rotate(-90deg)"
                  : "rotate(0deg)",
                transition: "transform var(--toolbar-transition)",
              }}
            >
              ▾
            </span>
          </div>
          {!collapsedSections.has("maps") &&
            maps.map((filename) => (
              <div
                key={filename}
                onClick={() =>
                  onSelectMap(
                    selectedMapFilename === filename ? null : filename
                  )
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
                    flex: 1,
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAsset(filename, "maps");
                  }}
                  title="Delete map"
                  style={{
                    width: "18px",
                    height: "18px",
                    flexShrink: 0,
                    borderRadius: "var(--radius-full)",
                    border: "1px solid #6a3030",
                    background: "transparent",
                    color: "#e07070",
                    fontSize: "11px",
                    lineHeight: "1",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition:
                      "background var(--toolbar-transition), border-color var(--toolbar-transition)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(224, 112, 112, 0.15)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "#e07070";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "#6a3030";
                  }}
                >
                  <span
                    style={{ display: "block", transform: "translateY(-1px)" }}
                  >
                    ×
                  </span>
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default UnitThumbnailList;
