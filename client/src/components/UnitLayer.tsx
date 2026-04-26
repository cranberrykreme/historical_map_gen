import React from "react";
import API_BASE_URL from "../config/api";
import { Unit } from "../types";

interface UnitLayerProps {
  units: Unit[];
  onUnitDrag: (id: string, x: number, y: number) => void;
  onUnitMove: (id: string, x: number, y: number) => void;
  onUnitRotate: (id: string, rotation: number) => void;
  onUnitRotateCommit: (id: string, rotation: number) => void;
  onUnitScale: (id: string, scale: number) => void;
  onUnitScaleCommit: (id: string, scale: number) => void;
  onUnitSelect: (id: string | null, addToSelection?: boolean) => void;
  onGroupDrag: (dx: number, dy: number) => void;
  onGroupMove: (dx: number, dy: number) => void;
  onGroupRotate: (delta: number) => void;
  onGroupRotateCommit: (delta: number) => void;
  onGroupScale: (delta: number) => void;
  onGroupScaleCommit: (delta: number) => void;
  setCursor: (cursor: string) => void;
  selectedUnitIds: Set<string>;
  scaleRef: React.RefObject<number>;
  isDraggingUnit: React.RefObject<boolean>;
  isShiftHeld: boolean;
}

function UnitLayer({
  units,
  onUnitDrag,
  onUnitMove,
  onUnitRotate,
  onUnitRotateCommit,
  onUnitScale,
  onUnitScaleCommit,
  onUnitSelect,
  onGroupDrag,
  onGroupMove,
  onGroupRotate,
  onGroupRotateCommit,
  onGroupScale,
  onGroupScaleCommit,
  selectedUnitIds,
  scaleRef,
  isDraggingUnit,
  isShiftHeld,
  setCursor,
}: UnitLayerProps) {
  const handleMouseDown = (e: React.MouseEvent, unitId: string) => {
    if (e.button !== 0) return;
    if (e.shiftKey) {
      onUnitSelect(unitId, true);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    isDraggingUnit.current = true;

    if (selectedUnitIds.size > 1 && selectedUnitIds.has(unitId)) {
      // Group drag
      let lastX = e.clientX;
      let lastY = e.clientY;
      let totalDx = 0;
      let totalDy = 0;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const scale = scaleRef.current ?? 1;
        const dx = (moveEvent.clientX - lastX) / scale;
        const dy = (moveEvent.clientY - lastY) / scale;
        lastX = moveEvent.clientX;
        lastY = moveEvent.clientY;
        totalDx += dx;
        totalDy += dy;
        onGroupDrag(totalDx, totalDy);
      };

      const handleMouseUp = () => {
        isDraggingUnit.current = false;
        onGroupMove(totalDx, totalDy);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      // Single unit drag
      onUnitSelect(unitId, false);
      const unit = units.find((u) => u.id === unitId);
      if (!unit) return;

      let currentX = unit.x;
      let currentY = unit.y;
      let lastX = e.clientX;
      let lastY = e.clientY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const scale = scaleRef.current ?? 1;
        const dx = (moveEvent.clientX - lastX) / scale;
        const dy = (moveEvent.clientY - lastY) / scale;
        lastX = moveEvent.clientX;
        lastY = moveEvent.clientY;
        currentX += dx;
        currentY += dy;
        onUnitDrag(unitId, currentX, currentY);
      };

      const handleMouseUp = () => {
        isDraggingUnit.current = false;
        onUnitMove(unitId, currentX, currentY);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
  };

  const handleRotateHandleMouseDown = (e: React.MouseEvent, unitId: string) => {
    if (e.shiftKey) return;
    e.stopPropagation();
    e.preventDefault();
    isDraggingUnit.current = true;
    setCursor("alias");

    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;

    const isGroup = selectedUnitIds.size > 1 && selectedUnitIds.has(unitId);
    let currentRotation = unit.rotation;
    let cumulativeDelta = 0;
    let lastX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - lastX;
      lastX = moveEvent.clientX;
      if (isGroup) {
        cumulativeDelta += dx;
        onGroupRotate(cumulativeDelta);
      } else {
        currentRotation += dx;
        onUnitRotate(unitId, currentRotation);
      }
    };

    const handleMouseUp = () => {
      isDraggingUnit.current = false;
      setCursor("grab");
      if (isGroup) {
        onGroupRotateCommit(cumulativeDelta);
      } else {
        onUnitRotateCommit(unitId, currentRotation);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleScaleHandleMouseDown = (e: React.MouseEvent, unitId: string) => {
    if (e.shiftKey) return;
    e.stopPropagation();
    e.preventDefault();
    isDraggingUnit.current = true;
    setCursor("nwse-resize");

    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;

    const isGroup = selectedUnitIds.size > 1 && selectedUnitIds.has(unitId);
    let currentScale = unit.scale;
    let cumulativeDelta = 0;
    let lastX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - lastX;
      lastX = moveEvent.clientX;
      if (isGroup) {
        cumulativeDelta += dx * 0.01;
        onGroupScale(cumulativeDelta);
      } else {
        currentScale = Math.min(Math.max(currentScale + dx * 0.01, 0.1), 5);
        onUnitScale(unitId, currentScale);
      }
    };

    const handleMouseUp = () => {
      isDraggingUnit.current = false;
      setCursor("grab");
      if (isGroup) {
        onGroupScaleCommit(cumulativeDelta);
      } else {
        onUnitScaleCommit(unitId, currentScale);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {units.map((unit) => {
        const isSelected = selectedUnitIds.has(unit.id);
        return (
          <div
            key={unit.id}
            data-unit="true"
            style={{
              position: "absolute",
              left: unit.x,
              top: unit.y,
              transform: `translate(-50%, -50%) rotate(${unit.rotation}deg) scale(${unit.scale})`,
              transformOrigin: "center center",
              pointerEvents: "all",
              zIndex: isSelected ? 1000 : 1,
            }}
          >
            <img
              src={`${API_BASE_URL}/api/assets/${unit.assetType}/${unit.filename}`}
              alt={unit.filename}
              style={{
                width: "48px",
                height: "auto",
                cursor: isShiftHeld ? "default" : "move",
                userSelect: "none",
                display: "block",
                outline: isSelected ? "2px solid #c8a84b" : "none",
              }}
              onMouseDown={(e) => handleMouseDown(e, unit.id)}
              draggable={false}
            />
            {isSelected && (
              <>
                <div
                  onMouseDown={(e) => handleRotateHandleMouseDown(e, unit.id)}
                  style={{
                    position: "absolute",
                    top: "-24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "#c8a84b",
                    cursor: isShiftHeld ? "default" : "alias",
                    pointerEvents: "all",
                  }}
                />
                <div
                  onMouseDown={(e) => handleScaleHandleMouseDown(e, unit.id)}
                  style={{
                    position: "absolute",
                    bottom: "-6px",
                    right: "-6px",
                    width: "12px",
                    height: "12px",
                    background: "#c8a84b",
                    cursor: isShiftHeld ? "default" : "nwse-resize",
                    pointerEvents: "all",
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default UnitLayer;
