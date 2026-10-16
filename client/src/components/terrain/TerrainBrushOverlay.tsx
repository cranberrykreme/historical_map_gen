import React, { useCallback, useEffect, useRef, useState } from "react";
import { Battle, PathPoint } from "../../types";
import { useMapStore } from "../../store/useMapStore";
import { useTerrainToolStore } from "../../store/useTerrainToolStore";
import { isLine } from "../../utils/terrain";
import { eraseTerrain, paintArea, paintLine } from "../../utils/terrainBrush";

// How far the mouse must move (in pixels on screen) before the stroke takes another point
const STEP = 2;
// How much [ and ] change the brush's size each press
const SIZE_STEP = 1.25;

// Covers the map while the brush or eraser is in use. Drag to paint (or rub out); each stroke
// is one undo step. Hold Space and drag to pan instead; the wheel still zooms. [ and ] change
// the brush's size, X swaps between brush and eraser, Esc puts it down. The brush's circle and
// the stroke being made are drawn on the map by TerrainHandles.
function TerrainBrushOverlay({
  battle,
  mapRef,
  scaleRef,
  isDraggingUnit,
}: {
  battle: Battle;
  mapRef: React.RefObject<HTMLDivElement | null>;
  scaleRef: React.RefObject<number>;
  isDraggingUnit: React.RefObject<boolean>;
}) {
  const editTerrain = useMapStore((state) => state.editTerrain);
  const brush = useTerrainToolStore((state) => state.brush);
  const brushKind = useTerrainToolStore((state) => state.brushKind);
  // While Space is held, dragging pans the map rather than painting
  const [panning, setPanning] = useState(false);
  const stroking = useRef(false);

  const toMap = useCallback(
    (e: { clientX: number; clientY: number }): PathPoint => {
      const rect = mapRef.current?.getBoundingClientRect();
      const s = scaleRef.current ?? 1;
      return rect
        ? { x: (e.clientX - rect.left) / s, y: (e.clientY - rect.top) / s }
        : { x: 0, y: 0 };
    },
    [mapRef, scaleRef]
  );

  // The stroke's changes, worked out from the terrain as it is now, as one undo step
  const commit = useCallback(
    (stroke: PathPoint[]) => {
      const tool = useTerrainToolStore.getState();
      const features =
        useMapStore.getState().battles.find((b) => b.id === battle.id)
          ?.terrain ?? [];
      const edit =
        tool.brush === "erase"
          ? eraseTerrain(
              features,
              stroke,
              tool.brushSize,
              tool.eraseAll ? null : tool.brushKind
            )
          : isLine(tool.brushKind)
            ? paintLine(tool.brushKind, stroke)
            : paintArea(features, tool.brushKind, stroke, tool.brushSize);
      editTerrain(battle.id, edit);
    },
    [battle.id, editTerrain]
  );

  useEffect(() => {
    const typing = (e: KeyboardEvent) => {
      const target = e.target;
      return (
        target instanceof Element && !!target.closest("input, textarea, select")
      );
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (typing(e)) return;
      const tool = useTerrainToolStore.getState();
      if (e.key === " ") {
        e.preventDefault();
        if (!stroking.current) setPanning(true);
      } else if (e.key === "[") {
        tool.setBrushSize(tool.brushSize / SIZE_STEP);
      } else if (e.key === "]") {
        tool.setBrushSize(tool.brushSize * SIZE_STEP);
      } else if (e.key.toLowerCase() === "x" && !e.metaKey && !e.ctrlKey) {
        if (!stroking.current)
          tool.setBrush(tool.brush === "erase" ? "paint" : "erase");
      } else if (e.key === "Escape") {
        // a stroke under way is given up; otherwise the brush is put down
        if (stroking.current) {
          stroking.current = false;
          tool.setStroke(null);
        } else tool.setBrush(null);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") setPanning(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      useTerrainToolStore.getState().setHover(null);
    };
  }, []);

  const startStroke = (e: React.MouseEvent) => {
    if (e.button !== 0 || e.shiftKey || panning) return;
    e.preventDefault();
    // stops the map panning under the stroke
    isDraggingUnit.current = true;
    stroking.current = true;
    const tool = useTerrainToolStore.getState();
    let stroke = [toMap(e)];
    tool.setStroke(stroke);
    const onMove = (ev: MouseEvent) => {
      if (!stroking.current) return;
      const at = toMap(ev);
      const last = stroke[stroke.length - 1];
      const s = scaleRef.current ?? 1;
      useTerrainToolStore.getState().setHover(at);
      if (Math.hypot(at.x - last.x, at.y - last.y) * s < STEP) return;
      stroke = [...stroke, at];
      useTerrainToolStore.getState().setStroke(stroke);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      isDraggingUnit.current = false;
      // Esc during the stroke gave it up
      if (stroking.current) commit(stroke);
      stroking.current = false;
      useTerrainToolStore.getState().setStroke(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // A line is drawn with a fine point; areas and the eraser show their circle instead
  const fine = brush === "paint" && isLine(brushKind);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 6,
        // (the map's own pan handler, on the container below, takes the drag while Space is
        // held, since no stroke stops it)
        cursor: panning ? "grab" : fine ? "crosshair" : "none",
      }}
      onMouseDown={startStroke}
      onMouseMove={(e) => useTerrainToolStore.getState().setHover(toMap(e))}
      onMouseLeave={() => {
        if (!stroking.current) useTerrainToolStore.getState().setHover(null);
      }}
    />
  );
}

export default TerrainBrushOverlay;
