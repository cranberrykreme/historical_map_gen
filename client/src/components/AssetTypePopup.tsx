import React from "react";
import { AssetType } from "../types";
import styles from "./AssetTypePopup.module.css";

interface AssetTypePopupProps {
  files: File[];
  onConfirm: (files: File[], type: AssetType) => void;
  onCancel: () => void;
}

function AssetTypePopup({ files, onConfirm, onCancel }: AssetTypePopupProps) {
  if (files.length === 0) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className={styles.modal}>
        <h2 className={styles.title}>Add Asset{files.length > 1 ? "s" : ""}</h2>
        <p className={styles.text}>
          {files.length === 1
            ? files[0].name
            : `${files.length} files selected`}
        </p>
        <p className={styles.text}>
          What type of asset {files.length > 1 ? "are these" : "is this"}?
        </p>

        <div className={styles.optionList}>
          {(["units", "portraits", "maps"] as AssetType[]).map((type) => (
            <button
              key={type}
              onClick={() => onConfirm(files, type)}
              className={styles.optionButton}
            >
              {type}
            </button>
          ))}
        </div>

        <button onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AssetTypePopup;
