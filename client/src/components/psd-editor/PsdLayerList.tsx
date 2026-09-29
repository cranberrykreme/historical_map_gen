import React, { useEffect, useState } from "react";
import API_BASE_URL from "../../config/api";
import { useAssetStore } from "../../store/useAssetStore";
import styles from "./PsdLayerList.module.css";

interface PsdLayer {
  index: number;
  name: string;
  filename: string;
}

interface PsdLayerListProps {
  psdName: string;
  selectedLayerFilename: string | null;
  onSelectLayer: (filename: string | null) => void;
}

function PsdLayerList({
  psdName,
  selectedLayerFilename,
  onSelectLayer,
}: PsdLayerListProps) {
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const [layers, setLayers] = useState<PsdLayer[]>([]);

  useEffect(() => {
    if (!currentProjectName) return;
    fetch(
      `${API_BASE_URL}/api/projects/${currentProjectName}/psd/${psdName}/layers`
    )
      .then((response) => response.json())
      .then((data) => setLayers(data.layers || []))
      .catch((error) => console.error("Failed to fetch PSD layers:", error));
  }, [currentProjectName, psdName]);

  return (
    <div className={styles.list}>
      <div
        className={`${styles.compositeRow} ${selectedLayerFilename === null ? styles.compositeRowActive : ""}`}
        onClick={() => onSelectLayer(null)}
      >
        <img
          src={`${API_BASE_URL}/api/projects/${currentProjectName}/psd/${psdName}/preview`}
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
              src={`${API_BASE_URL}/api/projects/${currentProjectName}/psd/${psdName}/layers/${layer.filename}`}
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
