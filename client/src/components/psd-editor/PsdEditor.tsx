import React, { useMemo, useState } from "react";
import PsdLayerList from "./PsdLayerList";
import PsdEditorCanvas, { RecolourSpec } from "./PsdEditorCanvas";
import PsdColorPalette from "./PsdColorPalette";
import { PALETTE } from "../../constants/palette";
import { useAssetStore } from "../../store/useAssetStore";
import API_BASE_URL from "../../config/api";
import { RgbColor } from "../../types";
import styles from "./PsdEditor.module.css";

interface PsdEditorProps {
  psdName: string;
  onClose: () => void;
}

type SampleMode = "interior" | "border" | null;

interface LayerSamples {
  interior: RgbColor | null;
  border: RgbColor | null;
}

const toCss = (c: RgbColor | null) =>
  c ? `rgb(${c.r}, ${c.g}, ${c.b})` : "transparent";

function PsdEditor({ psdName, onClose }: PsdEditorProps) {
  const currentProjectName = useAssetStore((state) => state.currentProjectName);

  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);
  const [selectedLayerFilename, setSelectedLayerFilename] = useState<
    string | null
  >(null);
  const [sampleMode, setSampleMode] = useState<SampleMode>(null);
  const [samples, setSamples] = useState<Record<string, LayerSamples>>({});
  const [applied, setApplied] = useState<Record<string, string>>({});

  const baseUrl = `${API_BASE_URL}/api/projects/${currentProjectName}/psd/${psdName}`;
  const layerUrl = selectedLayerFilename
    ? `${baseUrl}/layers/${selectedLayerFilename}`
    : null;
  const currentSamples: LayerSamples = (selectedLayerFilename &&
    samples[selectedLayerFilename]) || {
    interior: null,
    border: null,
  };
  const appliedId = selectedLayerFilename
    ? (applied[selectedLayerFilename] ?? null)
    : null;
  const paletteEntry = appliedId
    ? PALETTE.find((p) => p.id === appliedId)
    : undefined;
  const canRecolour = !!(currentSamples.interior && currentSamples.border);
  const hasUnsavedWork = Object.keys(applied).length > 0;

  const recolour = useMemo<RecolourSpec | null>(() => {
    if (!paletteEntry || !currentSamples.interior || !currentSamples.border)
      return null;
    return {
      interior: currentSamples.interior,
      border: currentSamples.border,
      fill: paletteEntry.fill,
      stroke: paletteEntry.stroke,
    };
  }, [paletteEntry, currentSamples.interior, currentSamples.border]);

  const handleSelectLayer = (filename: string | null) => {
    setSampleMode(null);
    setSelectedLayerFilename(filename);
  };

  const handleSample = (color: RgbColor) => {
    if (!selectedLayerFilename || !sampleMode) return;
    setSamples((prev) => ({
      ...prev,
      [selectedLayerFilename]: { ...currentSamples, [sampleMode]: color },
    }));
    setSampleMode(null);
  };

  const toggleMode = (mode: "interior" | "border") => {
    setSampleMode((prev) => (prev === mode ? null : mode));
  };

  // Picking a colour applies it; picking the active colour again removes it.
  const handlePickColour = (id: string) => {
    if (!selectedLayerFilename) return;
    setApplied((prev) => {
      const next = { ...prev };
      if (next[selectedLayerFilename] === id)
        delete next[selectedLayerFilename];
      else next[selectedLayerFilename] = id;
      return next;
    });
  };

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
            {selectedLayerFilename && (
              <div className={styles.toolRow}>
                <button
                  className={`${styles.toolButton} ${sampleMode === "interior" ? styles.toolButtonArmed : ""}`}
                  onClick={() => toggleMode("interior")}
                >
                  <span
                    className={styles.swatch}
                    style={{ background: toCss(currentSamples.interior) }}
                  />
                  Set interior colour
                </button>
                <button
                  className={`${styles.toolButton} ${sampleMode === "border" ? styles.toolButtonArmed : ""}`}
                  onClick={() => toggleMode("border")}
                >
                  <span
                    className={styles.swatch}
                    style={{ background: toCss(currentSamples.border) }}
                  />
                  Set border colour
                </button>
              </div>
            )}

            <div className={styles.canvasWrap}>
              <PsdEditorCanvas
                layerUrl={layerUrl}
                compositeUrl={`${baseUrl}/preview`}
                isSampling={sampleMode !== null}
                onSample={handleSample}
                recolour={recolour}
              />
            </div>

            {selectedLayerFilename && (
              <PsdColorPalette
                appliedId={appliedId}
                disabled={!canRecolour}
                onPick={handlePickColour}
              />
            )}
          </div>

          <div className={styles.sidebar}>
            <PsdLayerList
              psdName={psdName}
              selectedLayerFilename={selectedLayerFilename}
              onSelectLayer={handleSelectLayer}
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
