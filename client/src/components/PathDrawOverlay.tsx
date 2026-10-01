import React, { useEffect, useRef } from "react";
import { usePathToolStore } from "../store/usePathToolStore";
import styles from "./PathDrawOverlay.module.css";

interface PathDrawOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  scaleRef: React.RefObject<number>;
  positionRef: React.RefObject<{ x: number; y: number }>;
}

const CLICK_TOLERANCE_PX = 4; // moving further than this is a pan, not a click

function PathDrawOverlay({
  containerRef,
  scaleRef,
  positionRef,
}: PathDrawOverlayProps) {
  const addDrawingPoint = usePathToolStore((state) => state.addDrawingPoint);
  const removeLastDrawingPoint = usePathToolStore(
    (state) => state.removeLastDrawingPoint
  );
  const finishDrawing = usePathToolStore((state) => state.finishDrawing);
  const cancelDrawing = usePathToolStore((state) => state.cancelDrawing);
  const pointCount = usePathToolStore(
    (state) => state.drawingPoints?.length ?? 0
  );
  const mouseDownAt = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishDrawing();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelDrawing();
      } else if (
        e.key === "Backspace" ||
        (e.metaKey && !e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        removeLastDrawingPoint();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finishDrawing, cancelDrawing, removeLastDrawingPoint]);

  const handleClick = (e: React.MouseEvent) => {
    const start = mouseDownAt.current;
    mouseDownAt.current = null;
    if (!start) return;
    if (
      Math.hypot(e.clientX - start.x, e.clientY - start.y) > CLICK_TOLERANCE_PX
    )
      return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const scale = scaleRef.current;
    const position = positionRef.current;
    addDrawingPoint({
      x: (e.clientX - rect.left - position.x) / scale,
      y: (e.clientY - rect.top - position.y) / scale,
    });
  };

  return (
    <>
      <div
        className={styles.overlay}
        onMouseDown={(e) => {
          mouseDownAt.current = { x: e.clientX, y: e.clientY };
        }}
        onClick={handleClick}
        onDoubleClick={finishDrawing}
      />
      <div className={styles.hint}>
        {pointCount === 0
          ? "Click the map to place the first waypoint"
          : `${pointCount} waypoint${pointCount === 1 ? "" : "s"}`}
        {
          " · Enter or double-click to finish · Backspace removes the last · Esc cancels"
        }
      </div>
    </>
  );
}

export default PathDrawOverlay;
