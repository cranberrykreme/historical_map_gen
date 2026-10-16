import React, { useEffect, useRef, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useBlockToolStore } from "../../store/useBlockToolStore";
import BlockShape from "../BlockShape";

// How far the mouse can move (in pixels) and still count as a click rather than a pan
const CLICK_SLOP = 4;

// Covers the map while a formation block is being placed: the block follows the mouse, and a
// click puts it down there (and selects it, ready to reshape). Dragging still pans the map and
// the wheel still zooms; Esc gives up.
function BlockPlaceOverlay({
  mapRef,
  scaleRef,
}: {
  mapRef: React.RefObject<HTMLDivElement | null>;
  scaleRef: React.RefObject<number>;
}) {
  const draft = useBlockToolStore((state) => state.draft);
  const addBlockAtPosition = useMapStore((state) => state.addBlockAtPosition);
  const selectUnit = useMapStore((state) => state.selectUnit);
  const overlay = useRef<HTMLDivElement>(null);
  const down = useRef<{ x: number; y: number } | null>(null);
  // Where the mouse is over the overlay, in pixels
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      useBlockToolStore.getState().stopPlacing();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const local = (e: React.MouseEvent) => {
    const rect = overlay.current?.getBoundingClientRect();
    return rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : null;
  };

  const scale = scaleRef.current ?? 1;

  return (
    <div
      ref={overlay}
      style={{ position: "absolute", inset: 0, zIndex: 6, cursor: "copy" }}
      onMouseDown={(e) => {
        down.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseMove={(e) => setAt(local(e))}
      onMouseLeave={() => setAt(null)}
      onClick={(e) => {
        // a drag was a pan
        if (
          !down.current ||
          Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) >
            CLICK_SLOP
        )
          return;
        const rect = mapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const s = scaleRef.current ?? 1;
        const id = addBlockAtPosition(
          useBlockToolStore.getState().draft,
          (e.clientX - rect.left) / s,
          (e.clientY - rect.top) / s
        );
        useBlockToolStore.getState().stopPlacing();
        selectUnit(id);
      }}
    >
      {at && (
        <div
          style={{
            position: "absolute",
            left: at.x,
            top: at.y,
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity: 0.75,
            pointerEvents: "none",
          }}
        >
          <BlockShape block={draft} />
        </div>
      )}
    </div>
  );
}

export default BlockPlaceOverlay;
