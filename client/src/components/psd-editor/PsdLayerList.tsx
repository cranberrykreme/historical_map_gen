import React from "react";
import API_BASE_URL from "../../config/api";
import { useAssetStore } from "../../store/useAssetStore";
import { PsdLayer } from "../../types";
import styles from "./PsdLayerList.module.css";

interface PsdLayerListProps {
  psdName: string;
  layers: PsdLayer[];
  selectedLayerFilename: string | null;
  onSelectLayer: (filename: string | null) => void;
}

function PsdLayerList({
  psdName,
  layers,
  selectedLayerFilename,
  onSelectLayer,
}: PsdLayerListProps) {
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const baseUrl = `${API_BASE_URL}/api/projects/${currentProjectName}/psd/${psdName}`;

  return (
    <div className={styles.list}>
      <div
        className={`${styles.compositeRow} ${selectedLayerFilename === null ? styles.compositeRowActive : ""}`}
        onClick={() => onSelectLayer(null)}
      >
        <img
          src={`${baseUrl}/preview`}
          alt="Composite preview"
          className={styles.thumbnail}
        />
        <span
          className={`${styles.layerName} ${selectedLayerFilename === null ? styles.layerNameActive : ""}`}
        >
          Full composite
        </span>
      </div>

      <div className={styles.sectionLabel}>Layers</div>

      {layers.map((layer) => {
        const isActive = selectedLayerFilename === layer.filename;
        return (
          <div
            key={layer.filename}
            className={`${styles.layerRow} ${isActive ? styles.layerRowActive : ""}`}
            onClick={() => onSelectLayer(layer.filename)}
          >
            <img
              src={`${baseUrl}/layers/${layer.filename}`}
              alt={layer.name}
              className={styles.thumbnail}
            />
            <span
              className={`${styles.layerName} ${isActive ? styles.layerNameActive : ""}`}
            >
              {layer.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default PsdLayerList;
