import React, { useEffect, useState } from "react";
import PortraitCanvas from "./PortraitCanvas";
import PsdColorPalette from "../psd-editor/PsdColorPalette";
import useEditHistory from "../../hooks/useEditHistory";
import usePortraitImage from "../../hooks/usePortraitImage";
import { PALETTE } from "../../constants/palette";
import { useAssetStore } from "../../store/useAssetStore";
import API_BASE_URL from "../../config/api";
import { Circle, defaultCircle } from "../../utils/portraitCircle";
import { renderPortraitBlob } from "../../utils/portraitRender";
import styles from "../psd-editor/PsdEditor.module.css";
import panelStyles from "../toolbar/PsdPanel.module.css";
import portraitStyles from "./PortraitEditor.module.css";

interface PortraitEditorProps {
  sourceName: string;
  onClose: () => void;
}

interface PortraitEdit {
  circle: Circle | null; // null means "use the default circle"
  colourId: string | null;
  ringPercent: number;
}

const DEFAULT_RING_PERCENT = 8;

function PortraitEditor({ sourceName, onClose }: PortraitEditorProps) {
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const fetchAssetList = useAssetStore((state) => state.fetchAssetList);
  const imageUrl = `${API_BASE_URL}/api/projects/${currentProjectName}/portrait-sources/${sourceName}`;
  const { image, size } = usePortraitImage(imageUrl);

  const { present, commit, undo, redo, canUndo, canRedo } =
    useEditHistory<PortraitEdit>({
      circle: null,
      colourId: null,
      ringPercent: DEFAULT_RING_PERCENT,
    });
  const [draftCircle, setDraftCircle] = useState<Circle | null>(null);
  const [draftPercent, setDraftPercent] = useState<number | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);
  const [savedKey, setSavedKey] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const committedCircle = size ? (present.circle ?? defaultCircle(size)) : null;
  const displayCircle = draftCircle ?? committedCircle;
  const ringPercent = draftPercent ?? present.ringPercent;
  const paletteEntry = present.colourId
    ? PALETTE.find((p) => p.id === present.colourId)
    : undefined;
  const ringColour = paletteEntry ? paletteEntry.fill : null;

  const editKey = JSON.stringify(present);
  const hasUnsavedWork = present.colourId !== null && editKey !== savedKey;

  const sourceStem = sourceName.replace(/\.[^/.]+$/, "");
  const outputName = `${sourceStem}${paletteEntry ? `_${paletteEntry.label}` : ""}.png`;

  // Editor-only undo/redo shortcuts (ProjectView's shortcuts are disabled while this is open)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.metaKey || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const showStatus = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCommitCircle = (next: Circle) => {
    commit((prev) => ({ ...prev, circle: next }));
  };

  // Picking a colour applies it; picking the active colour again removes the ring.
  const handlePickColour = (id: string) => {
    commit((prev) => ({ ...prev, colourId: prev.colourId === id ? null : id }));
  };

  const commitPercent = () => {
    if (draftPercent === null) return;
    const value = draftPercent;
    setDraftPercent(null);
    if (value !== present.ringPercent) {
      commit((prev) => ({ ...prev, ringPercent: value }));
    }
  };

  const render = () => {
    if (!image || !committedCircle) return Promise.resolve(null);
    return renderPortraitBlob(
      image,
      committedCircle,
      ringColour,
      present.ringPercent
    );
  };

  const handleExport = async () => {
    const blob = await render();
    if (!blob) {
      showStatus("Could not render the portrait");
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = outputName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showStatus(`Exported ${outputName}`);
  };

  const handleSave = async () => {
    const blob = await render();
    if (!blob) {
      showStatus("Could not render the portrait");
      return;
    }

    const formData = new FormData();
    formData.append(
      "file",
      new File([blob], outputName, { type: "image/png" })
    );
    formData.append("type", "portraits");
    formData.append("unique", "true");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${currentProjectName}/assets/upload`,
        { method: "POST", body: formData }
      );
      const data = await response.json();
      if (data.success) {
        fetchAssetList("portraits");
        setSavedKey(editKey);
        showStatus(`Saved as ${data.filename}`);
      } else {
        showStatus(data.error || "Save failed");
      }
    } catch (error) {
      console.error("Failed to save portrait:", error);
      showStatus("Save failed");
    }
  };

  const handleCloseClick = () => {
    if (hasUnsavedWork) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const ready = !!(image && displayCircle);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{sourceName}</h2>
          <div className={styles.headerActions}>
            {statusMessage && (
              <span className={styles.statusMessage}>{statusMessage}</span>
            )}
            <button
              className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
              onClick={handleSave}
              disabled={!ready}
              title="Save into this project's portraits"
            >
              Save to portraits
            </button>
            <button
              className={styles.actionButton}
              onClick={handleExport}
              disabled={!ready}
              title="Download the portrait as a PNG"
            >
              Export PNG
            </button>
            <button
              className={styles.closeButton}
              onClick={undo}
              disabled={!canUndo}
              title="Undo (⌘Z)"
            >
              ↶
            </button>
            <button
              className={styles.closeButton}
              onClick={redo}
              disabled={!canRedo}
              title="Redo (⇧⌘Z)"
            >
              ↷
            </button>
            <button
              className={styles.closeButton}
              onClick={handleCloseClick}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.canvasArea}>
            <div className={styles.canvasWrap}>
              {size && displayCircle ? (
                <PortraitCanvas
                  imageUrl={imageUrl}
                  size={size}
                  circle={displayCircle}
                  ringColour={ringColour}
                  ringPercent={ringPercent}
                  onDraft={setDraftCircle}
                  onCommit={handleCommitCircle}
                />
              ) : (
                <p className={panelStyles.emptyMessage}>Loading image…</p>
              )}
            </div>

            <div className={portraitStyles.controlsRow}>
              <PsdColorPalette
                appliedId={present.colourId}
                disabled={false}
                onPick={handlePickColour}
              />
              <div className={portraitStyles.sliderGroup}>
                <span className={portraitStyles.sliderLabel}>
                  Ring thickness
                </span>
                <input
                  type="range"
                  min={2}
                  max={25}
                  step={1}
                  value={ringPercent}
                  onChange={(e) => setDraftPercent(Number(e.target.value))}
                  onPointerUp={commitPercent}
                  onKeyUp={commitPercent}
                  onBlur={commitPercent}
                  className={portraitStyles.slider}
                />
                <span className={portraitStyles.sliderValue}>
                  {ringPercent}%
                </span>
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <p className={panelStyles.emptyMessage}>
              Drag the circle or its outline to move it, and drag the round
              handle to resize it. Pick a faction colour and ring thickness
              below, then save it into your portraits. Scroll to zoom and drag
              the background to pan.
            </p>
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
              You have an unsaved portrait. Closing now will lose it.
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

export default PortraitEditor;
