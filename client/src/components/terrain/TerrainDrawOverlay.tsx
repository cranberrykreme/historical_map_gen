import React, { useCallback, useEffect, useRef } from "react";
import { Battle, PathPoint } from "../../types";
import { useMapStore } from "../../store/useMapStore";
import { useTerrainToolStore } from "../../store/useTerrainToolStore";
import { minPoints } from "../../utils/terrain/terrain";

// How far the mouse can move (in pixels) and still count as a click rather than a pan
const CLICK_SLOP = 4;
// Points closer than this on screen (pixels) are the same point, as a double-click makes
const SAME_POINT = 3;

// Covers the map while a terrain feature is being drawn: each click adds a point, a double-
// click or Enter finishes it, Backspace takes the last point back, Esc gives up. Dragging still
// pans the map, and the wheel still zooms.
function TerrainDrawOverlay({
  battle,
  mapRef,
  scaleRef,
}: {
  battle: Battle;
  mapRef: React.RefObject<HTMLDivElement | null>;
  scaleRef: React.RefObject<number>;
}) {
  const down = useRef<{ x: number; y: number } | null>(null);
  const addTerrain = useMapStore((state) => state.addTerrain);

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

  // Adds the shape to the battle, then selects it for editing. Too few points so far, and
  // drawing just carries on.
  const finish = useCallback(() => {
    const tool = useTerrainToolStore.getState();
    if (!tool.drawing || tool.draft.length < minPoints(tool.drawing)) return;
    const id = addTerrain(battle.id, tool.drawing, tool.draft);
    tool.stopDrawing();
    if (id) {
      tool.setEditing(true);
      tool.select(id);
    }
  }, [addTerrain, battle.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Typing in a box isn't drawing
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest("input, textarea, select")
      )
        return;
      const tool = useTerrainToolStore.getState();
      if (e.key === "Enter") {
        e.preventDefault();
        finish();
      } else if (e.key === "Escape") {
        tool.stopDrawing();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        tool.removeLastPoint();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      useTerrainToolStore.getState().setHover(null);
    };
  }, [finish]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 6,
        cursor: "crosshair",
      }}
      onMouseDown={(e) => {
        down.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseMove={(e) => useTerrainToolStore.getState().setHover(toMap(e))}
      onMouseLeave={() => useTerrainToolStore.getState().setHover(null)}
      onClick={(e) => {
        // A drag was a pan, and the second click of a double-click is the finish
        if (
          !down.current ||
          Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) >
            CLICK_SLOP ||
          e.detail > 1
        )
          return;
        const tool = useTerrainToolStore.getState();
        const point = toMap(e);
        const last = tool.draft[tool.draft.length - 1];
        const s = scaleRef.current ?? 1;
        if (
          last &&
          Math.hypot(point.x - last.x, point.y - last.y) * s < SAME_POINT
        )
          return;
        tool.addPoint(point);
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        finish();
      }}
    />
  );
}

export default TerrainDrawOverlay;
