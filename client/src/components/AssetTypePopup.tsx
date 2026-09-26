import React from "react";
import { AssetType } from "../types";
import styles from "./AssetTypePopup.module.css";

interface AssetTypePopupProps {
  file: File | null;
  onConfirm: (file: File, type: AssetType) => void;
  onCancel: () => void;
}

function AssetTypePopup({ file, onConfirm, onCancel }: AssetTypePopupProps) {
  if (!file) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className={styles.modal}>
        <h2 className={styles.title}>Add Asset</h2>
        <p className={styles.text}>{file.name}</p>
        <p className={styles.text}>What type of asset is this?</p>

        <div className={styles.optionList}>
          {(["units", "portraits", "maps"] as AssetType[]).map((type) => (
            <button
              key={type}
              onClick={() => onConfirm(file, type)}
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
