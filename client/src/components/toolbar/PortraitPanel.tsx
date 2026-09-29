import React, { useEffect } from "react";
import ToolbarButton from "./ToolbarButton";
import { useAssetStore } from "../../store/useAssetStore";
import API_BASE_URL from "../../config/api";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PsdPanel.module.css";

interface PortraitPanelProps {
  onSelectSource: (filename: string) => void;
}

function PortraitPanel({ onSelectSource }: PortraitPanelProps) {
  const sources = useAssetStore((state) => state.portraitSources);
  const fetchPortraitSources = useAssetStore(
    (state) => state.fetchPortraitSources
  );
  const uploadPortraitSource = useAssetStore(
    (state) => state.uploadPortraitSource
  );
  const deletePortraitSource = useAssetStore(
    (state) => state.deletePortraitSource
  );
  const currentProjectName = useAssetStore((state) => state.currentProjectName);

  useEffect(() => {
    fetchPortraitSources();
  }, [fetchPortraitSources]);

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".png,.jpg,.jpeg";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      for (const file of Array.from(files)) {
        await uploadPortraitSource(file);
      }
    };
    input.click();
  };

  return (
    <div className={styles.panel}>
      <ToolbarButton
        icon="+"
        label="Import Image"
        onClick={handleImport}
        isExpanded={true}
      />

      <div className={styles.psdList}>
        {sources.length === 0 && (
          <p className={styles.emptyMessage}>
            No portrait images imported yet.
          </p>
        )}
        {sources.map((name) => (
          <div
            key={name}
            className={styles.psdRow}
            onClick={() => onSelectSource(name)}
          >
            <img
              src={`${API_BASE_URL}/api/projects/${currentProjectName}/portrait-sources/${name}`}
              alt={name}
              className={styles.thumbnail}
            />
            <span className={styles.psdName}>{name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deletePortraitSource(name);
              }}
              title="Delete image"
              className={deleteStyles.deleteButton}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PortraitPanel;
