import React, { useEffect, useMemo, useState } from "react";
import PsdLayerList from "./PsdLayerList";
import PsdEditorCanvas from "./PsdEditorCanvas";
import PsdColorPalette from "./PsdColorPalette";
import useEditHistory from "../../hooks/useEditHistory";
import usePsdLayers from "../../hooks/usePsdLayers";
import { PALETTE } from "../../constants/palette";
import { useAssetStore } from "../../store/useAssetStore";
import API_BASE_URL from "../../config/api";
import { RecolourSpec, RgbColor } from "../../types";
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

interface EditState {
  samples: Record<string, LayerSamples>;
  applied: Record<string, string>;
}

const EMPTY_SAMPLES: LayerSamples = { interior: null, border: null };
const toCss = (c: RgbColor | null) =>
  c ? `rgb(${c.r}, ${c.g}, ${c.b})` : "transparent";

function PsdEditor({ psdName, onClose }: PsdEditorProps) {
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const layers = usePsdLayers(currentProjectName, psdName);

  const { present, commit, undo, redo, canUndo, canRedo } =
    useEditHistory<EditState>({
      samples: {},
      applied: {},
    });
  const { samples, applied } = present;

  const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);
  const [selectedLayerFilename, setSelectedLayerFilename] = useState<
    string | null
  >(null);
  const [sampleMode, setSampleMode] = useState<SampleMode>(null);

  const baseUrl = `${API_BASE_URL}/api/projects/${currentProjectName}/psd/${psdName}`;
  const layerUrl = selectedLayerFilename
    ? `${baseUrl}/layers/${selectedLayerFilename}`
    : null;
  const currentSamples: LayerSamples =
    (selectedLayerFilename && samples[selectedLayerFilename]) || EMPTY_SAMPLES;
  const appliedId = selectedLayerFilename
    ? (applied[selectedLayerFilename] ?? null)
    : null;
  const canRecolour = !!(currentSamples.interior && currentSamples.border);
  const hasUnsavedWork = Object.keys(applied).length > 0;

  // Every layer that currently has a colour applied and both samples set
  const compositeEdits = useMemo<Record<string, RecolourSpec>>(() => {
    const result: Record<string, RecolourSpec> = {};
    Object.entries(applied).forEach(([filename, colourId]) => {
      const entry = PALETTE.find((p) => p.id === colourId);
      const layerSamples = samples[filename];
      if (entry && layerSamples?.interior && layerSamples?.border) {
        result[filename] = {
          interior: layerSamples.interior,
          border: layerSamples.border,
          fill: entry.fill,
          stroke: entry.stroke,
        };
      }
    });
    return result;
  }, [applied, samples]);

  const recolour = selectedLayerFilename
    ? (compositeEdits[selectedLayerFilename] ?? null)
    : null;

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

  const handleSelectLayer = (filename: string | null) => {
    setSampleMode(null);
    setSelectedLayerFilename(filename);
  };

  const handleSample = (color: RgbColor) => {
    if (!selectedLayerFilename || !sampleMode) return;
    const layer = selectedLayerFilename;
    const mode = sampleMode;
    commit((prev) => ({
      ...prev,
      samples: {
        ...prev.samples,
        [layer]: { ...(prev.samples[layer] ?? EMPTY_SAMPLES), [mode]: color },
      },
    }));
    setSampleMode(null);
  };

  const toggleMode = (mode: "interior" | "border") => {
    setSampleMode((prev) => (prev === mode ? null : mode));
  };

  // Picking a colour applies it; picking the active colour again removes it.
  const handlePickColour = (id: string) => {
    if (!selectedLayerFilename) return;
    const layer = selectedLayerFilename;
    commit((prev) => {
      const nextApplied = { ...prev.applied };
      if (nextApplied[layer] === id) delete nextApplied[layer];
      else nextApplied[layer] = id;
      return { ...prev, applied: nextApplied };
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
          <div className={styles.headerActions}>
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
                layerBaseUrl={`${baseUrl}/layers`}
                layers={layers}
                compositeEdits={compositeEdits}
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
              layers={layers}
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
