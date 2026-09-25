import React from "react";
import UnitThumbnail from "./UnitThumbnail";
import { AssetType } from "../../types";

interface UnitThumbnailListProps {
  units: string[];
  portraits: string[];
  onPlaceUnit: (filename: string, assetType: AssetType) => void;
}

function UnitThumbnailList({
  units,
  portraits,
  onPlaceUnit,
}: UnitThumbnailListProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xs)",
        overflowY: "auto",
        marginTop: "var(--space-md)",
      }}
    >
      {units.map((filename) => (
        <UnitThumbnail
          key={filename}
          filename={filename}
          assetType="units"
          onClick={() => onPlaceUnit(filename, "units")}
        />
      ))}
      {portraits.map((filename) => (
        <UnitThumbnail
          key={filename}
          filename={filename}
          assetType="portraits"
          onClick={() => onPlaceUnit(filename, "portraits")}
        />
      ))}
    </div>
  );
}

export default UnitThumbnailList;
