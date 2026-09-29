import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import usePanZoom from "../../hooks/usePanZoom";
import {
  Circle,
  ImageSize,
  moveCircle,
  resizeCircle,
} from "../../utils/portraitCircle";
import { RgbColor } from "../../types";
import styles from "../psd-editor/PsdEditorCanvas.module.css";

interface PortraitCanvasProps {
  imageUrl: string;
  size: ImageSize;
  circle: Circle;
  ringColour: RgbColor | null;
  ringPercent: number;
  onDraft: (circle: Circle | null) => void;
  onCommit: (circle: Circle) => void;
}

function PortraitCanvas({
  imageUrl,
  size,
  circle,
  ringColour,
  ringPercent,
  onDraft,
  onCommit,
}: PortraitCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [unitsPerPx, setUnitsPerPx] = useState<number>(1);
  const { viewportRef, transform, isPanning, onMouseDown, zoomBy, reset } =
    usePanZoom();

  useEffect(() => {
    reset();
  }, [imageUrl, reset]);

  // Track the viewport size so the image can be fitted to it
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () =>
      setViewportSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewportRef]);

  // Image units per on-screen pixel, so handles and outlines keep a constant screen size
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const next = size.width / rect.width;
    setUnitsPerPx((prev) => (Math.abs(prev - next) < 1e-6 ? prev : next));
  });

  const fit =
    viewportSize.width > 0 && viewportSize.height > 0
      ? Math.min(
          viewportSize.width / size.width,
          viewportSize.height / size.height
        ) * 0.98
      : 1;
  const displayWidth = size.width * fit;
  const displayHeight = size.height * fit;

  const toImagePoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * size.width,
      y: ((clientY - rect.top) / rect.height) * size.height,
    };
  };

  const startDrag = (e: React.MouseEvent, mode: "move" | "resize") => {
    e.stopPropagation(); // don't start a pan
    e.preventDefault();
    const origin = circle;
    const start = toImagePoint(e.clientX, e.clientY);
    let latest = origin;

    const onMove = (ev: MouseEvent) => {
      const p = toImagePoint(ev.clientX, ev.clientY);
      latest =
        mode === "move"
          ? moveCircle(origin, p.x - start.x, p.y - start.y, size)
          : resizeCircle(
              origin,
              Math.hypot(p.x - origin.cx, p.y - origin.cy),
              size
            );
      onDraft(latest);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      onDraft(null);
      if (latest !== origin) onCommit(latest);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const { cx, cy, r } = circle;
  const circlePath = `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  const dimPath = `M 0 0 H ${size.width} V ${size.height} H 0 Z ${circlePath}`;

  // Faction ring preview: drawn just inside the circle's edge
  const ringWidth = r * (ringPercent / 100);

  // Single resize handle at the bottom-right of the circle
  const handleX = cx + r * Math.SQRT1_2;
  const handleY = cy + r * Math.SQRT1_2;

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
        <svg
          ref={svgRef}
          width={displayWidth}
          height={displayHeight}
          viewBox={`0 0 ${size.width} ${size.height}`}
          style={{ flexShrink: 0, display: "block", overflow: "visible" }}
        >
          <image
            href={imageUrl}
            width={size.width}
            height={size.height}
            style={{
              imageRendering: transform.scale >= 4 ? "pixelated" : "auto",
            }}
          />
          <path
            d={dimPath}
            fill="rgba(0, 0, 0, 0.6)"
            fillRule="evenodd"
            style={{ pointerEvents: "none" }}
          />

          {/* Faction ring preview */}
          {ringColour && (
            <circle
              cx={cx}
              cy={cy}
              r={r - ringWidth / 2}
              fill="none"
              stroke={`rgb(${ringColour.r}, ${ringColour.g}, ${ringColour.b})`}
              strokeWidth={ringWidth}
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* Interior: drag to move */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="rgba(0, 0, 0, 0)"
            style={{ cursor: "move" }}
            onMouseDown={(e) => startDrag(e, "move")}
          />

          {/* Visible gold outline */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#c8a84b"
            strokeWidth={4 * unitsPerPx}
            style={{ pointerEvents: "none" }}
          />

          {/* Wide invisible band around the outline: also drags to move */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(0, 0, 0, 0)"
            strokeWidth={20 * unitsPerPx}
            style={{ pointerEvents: "stroke", cursor: "move" }}
            onMouseDown={(e) => startDrag(e, "move")}
          />

          {/* Resize handle (drawn last so it sits on top) */}
          <circle
            cx={handleX}
            cy={handleY}
            r={10 * unitsPerPx}
            fill="#c8a84b"
            stroke="#1a1225"
            strokeWidth={2 * unitsPerPx}
            style={{ cursor: "nwse-resize" }}
            onMouseDown={(e) => startDrag(e, "resize")}
          />
        </svg>
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

export default PortraitCanvas;
