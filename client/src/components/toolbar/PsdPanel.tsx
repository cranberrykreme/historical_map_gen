import React, { useEffect } from "react";
import ToolbarButton from "./ToolbarButton";
import { useAssetStore } from "../../store/useAssetStore";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PsdPanel.module.css";

interface PsdPanelProps {
  onSelectPsd: (name: string) => void;
}

function PsdPanel({ onSelectPsd }: PsdPanelProps) {
  const psds = useAssetStore((state) => state.psds);
  const fetchPsdList = useAssetStore((state) => state.fetchPsdList);
  const uploadPsd = useAssetStore((state) => state.uploadPsd);
  const deletePsd = useAssetStore((state) => state.deletePsd);

  useEffect(() => {
    fetchPsdList();
  }, [fetchPsdList]);

  const handleAddPsd = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".psd";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadPsd(file);
    };
    input.click();
  };

  return (
    <div className={styles.panel}>
      <ToolbarButton
        icon="+"
        label="Import PSD"
        onClick={handleAddPsd}
        isExpanded={true}
      />

      <div className={styles.psdList}>
        {psds.length === 0 && (
          <p className={styles.emptyMessage}>No PSD files imported yet.</p>
        )}
        {psds.map((name) => (
          <div
            key={name}
            className={styles.psdRow}
            onClick={() => onSelectPsd(name)}
          >
            <span className={styles.psdName}>{name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deletePsd(name);
              }}
              title="Delete PSD"
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

export default PsdPanel;
