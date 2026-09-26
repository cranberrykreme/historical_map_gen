import { useState, useCallback } from "react";
import { Unit } from "../types";

interface SelectionBoxState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface UseSelectionBoxParams {
  containerRef: React.RefObject<HTMLDivElement | null>;
  scaleRef: React.RefObject<number>;
  positionRef: React.RefObject<{ x: number; y: number }>;
  displayUnits: Unit[];
  boxSelect: (ids: string[]) => void;
}

function useSelectionBox({
  containerRef,
  scaleRef,
  positionRef,
  displayUnits,
  boxSelect,
}: UseSelectionBoxParams) {
  const [selectionBox, setSelectionBox] = useState<SelectionBoxState | null>(
    null
  );

  const startSelection = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;
      setSelectionBox({ startX, startY, endX: startX, endY: startY });

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setSelectionBox((prev) =>
          prev
            ? {
                ...prev,
                endX: moveEvent.clientX - rect.left,
                endY: moveEvent.clientY - rect.top,
              }
            : null
        );
      };

      const handleMouseUp = () => {
        setSelectionBox((prev) => {
          if (!prev) return null;
          const scale = scaleRef.current ?? 1;
          const position = positionRef.current ?? { x: 0, y: 0 };
          const left = (Math.min(prev.startX, prev.endX) - position.x) / scale;
          const right = (Math.max(prev.startX, prev.endX) - position.x) / scale;
          const top = (Math.min(prev.startY, prev.endY) - position.y) / scale;
          const bottom =
            (Math.max(prev.startY, prev.endY) - position.y) / scale;
          const selectedIds = displayUnits
            .filter(
              (unit) =>
                unit.x >= left &&
                unit.x <= right &&
                unit.y >= top &&
                unit.y <= bottom
            )
            .map((unit) => unit.id);
          boxSelect(selectedIds);
          return null;
        });
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [containerRef, scaleRef, positionRef, displayUnits, boxSelect]
  );

  const boxStyle = selectionBox
    ? {
        left: Math.min(selectionBox.startX, selectionBox.endX),
        top: Math.min(selectionBox.startY, selectionBox.endY),
        width: Math.abs(selectionBox.endX - selectionBox.startX),
        height: Math.abs(selectionBox.endY - selectionBox.startY),
      }
    : null;

  return { startSelection, boxStyle };
}

export default useSelectionBox;
