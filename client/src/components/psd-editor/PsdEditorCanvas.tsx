import React, { useEffect } from "react";
import usePsdLayerColouring from "../../hooks/usePsdLayerColouring";
import usePanZoom from "../../hooks/usePanZoom";
import { RgbColor } from "../../types";
import styles from "./PsdEditorCanvas.module.css";

export interface RecolourSpec {
  interior: RgbColor;
  border: RgbColor;
  fill: RgbColor;
  stroke: RgbColor;
}

interface PsdEditorCanvasProps {
  layerUrl: string | null;
  compositeUrl: string;
  isSampling: boolean;
  onSample: (color: RgbColor) => void;
  recolour: RecolourSpec | null;
}

function PsdEditorCanvas({
  layerUrl,
  compositeUrl,
  isSampling,
  onSample,
  recolour,
}: PsdEditorCanvasProps) {
  const {
    canvasRef,
    imageLoaded,
    loadImageToCanvas,
    sampleColorAt,
    applyRecolour,
    restoreOriginal,
  } = usePsdLayerColouring();
  const {
    viewportRef,
    transform,
    isPanning,
    hasDragged,
    onMouseDown,
    zoomBy,
    reset,
  } = usePanZoom();

  useEffect(() => {
    if (layerUrl) {
      loadImageToCanvas(layerUrl);
    }
  }, [layerUrl, loadImageToCanvas]);

  useEffect(() => {
    reset();
  }, [layerUrl, reset]);

  useEffect(() => {
    if (!imageLoaded) return;
    if (recolour) {
      applyRecolour(
        recolour.interior,
        recolour.border,
        recolour.fill,
        recolour.stroke
      );
    } else {
      restoreOriginal();
    }
  }, [imageLoaded, recolour, applyRecolour, restoreOriginal]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isSampling || hasDragged.current) return;
    const color = sampleColorAt(e.clientX, e.clientY);
    if (color) onSample(color);
  };

  const pixelated = transform.scale >= 2 ? styles.pixelated : "";

  return (
    <div
      ref={viewportRef}
      onMouseDown={onMouseDown}
      className={`${styles.viewport} ${isPanning ? styles.panning : ""}`}
    >
      <div
        className={styles.content}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {layerUrl ? (
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            className={`${styles.surface} ${pixelated} ${isSampling ? styles.sampling : ""}`}
          />
        ) : (
          <img
            src={compositeUrl}
            alt="Composite preview"
            className={`${styles.surface} ${pixelated}`}
          />
        )}
      </div>

      <div className={styles.controls} onMouseDown={(e) => e.stopPropagation()}>
        <button
          className={styles.zoomButton}
          onClick={() => zoomBy(1 / 1.5)}
          title="Zoom out"
        >
          −
        </button>
        <span className={styles.zoomLabel}>
          {Math.round(transform.scale * 100)}%
        </span>
        <button
          className={styles.zoomButton}
          onClick={() => zoomBy(1.5)}
          title="Zoom in"
        >
          +
        </button>
        <button
          className={styles.zoomButton}
          onClick={reset}
          title="Reset view"
        >
          ↺
        </button>
      </div>
    </div>
  );
}

export default PsdEditorCanvas;
