import React, { useState } from "react";
import PsdLayerList from "./PsdLayerList";
import styles from "./PsdEditor.module.css";

interface PsdEditorProps {
  psdName: string;
  onClose: () => void;
}

function PsdEditor({ psdName, onClose }: PsdEditorProps) {
  const [hasUnsavedWork, setHasUnsavedWork] = useState<boolean>(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);
  const [selectedLayerFilename, setSelectedLayerFilename] = useState<
    string | null
  >(null);

  const handleCloseClick = () => {
    if (hasUnsavedWork) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{psdName}</h2>
          <button
            className={styles.closeButton}
            onClick={handleCloseClick}
            title="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.canvasArea}>
            {/* Canvas goes here in the next step */}
            <p
              style={{
                color: "var(--color-text-dim)",
                fontFamily: "var(--font-ui)",
              }}
            >
              {selectedLayerFilename
                ? `Editing: ${selectedLayerFilename}`
                : "Showing composite preview"}
            </p>
          </div>

          <div className={styles.sidebar}>
            <PsdLayerList
              psdName={psdName}
              selectedLayerFilename={selectedLayerFilename}
              onSelectLayer={setSelectedLayerFilename}
            />
          </div>
        </div>
      </div>

      {showCloseConfirm && (
        <div
          className={styles.confirmOverlay}
          onClick={() => setShowCloseConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={styles.confirmModal}
          >
            <h3 className={styles.confirmTitle}>Discard changes?</h3>
            <p className={styles.confirmText}>
              You have unsaved colouring work. Closing now will lose it.
            </p>
            <button className={styles.confirmButton} onClick={onClose}>
              Discard and close
            </button>
            <button
              className={styles.cancelButton}
              onClick={() => setShowCloseConfirm(false)}
            >
              Keep editing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PsdEditor;
