import React from "react";
import API_BASE_URL from "../config/api";
import { Unit } from "../types";
import { useMapStore } from "../store/useMapStore";
import { useAssetStore } from "../store/useAssetStore";

interface UnitLayerProps {
  units: Unit[];
  scaleRef: React.RefObject<number>;
  isDraggingUnit: React.RefObject<boolean>;
  isShiftHeld: boolean;
  setCursor: (cursor: string) => void;
}

function UnitLayer({
  units,
  scaleRef,
  isDraggingUnit,
  isShiftHeld,
  setCursor,
}: UnitLayerProps) {
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const selectUnit = useMapStore((state) => state.selectUnit);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const setDragPosition = useMapStore((state) => state.setDragPosition);
  const setDragRotation = useMapStore((state) => state.setDragRotation);
  const setDragScale = useMapStore((state) => state.setDragScale);
  const setGroupDragDelta = useMapStore((state) => state.setGroupDragDelta);
  const setGroupRotateDelta = useMapStore((state) => state.setGroupRotateDelta);
  const setGroupScaleDelta = useMapStore((state) => state.setGroupScaleDelta);
  const commitUnitMove = useMapStore((state) => state.commitUnitMove);
  const commitUnitRotate = useMapStore((state) => state.commitUnitRotate);
  const commitUnitScale = useMapStore((state) => state.commitUnitScale);
  const commitGroupMove = useMapStore((state) => state.commitGroupMove);
  const commitGroupRotate = useMapStore((state) => state.commitGroupRotate);
  const commitGroupScale = useMapStore((state) => state.commitGroupScale);

  const handleMouseDown = (e: React.MouseEvent, unitId: string) => {
    if (e.button !== 0) return;
    if (e.shiftKey) {
      selectUnit(unitId, true);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    isDraggingUnit.current = true;

    if (selectedUnitIds.size > 1 && selectedUnitIds.has(unitId)) {
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
        setGroupDragDelta({ dx: totalDx, dy: totalDy });
      };

      const handleMouseUp = () => {
        isDraggingUnit.current = false;
        commitGroupMove(totalDx, totalDy);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      selectUnit(unitId, false);
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
        setDragPosition({ id: unitId, x: currentX, y: currentY });
      };

      const handleMouseUp = () => {
        isDraggingUnit.current = false;
        commitUnitMove(unitId, currentX, currentY);
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
        setGroupRotateDelta(cumulativeDelta);
      } else {
        currentRotation += dx;
        setDragRotation({ id: unitId, rotation: currentRotation });
      }
    };

    const handleMouseUp = () => {
      isDraggingUnit.current = false;
      setCursor("grab");
      if (isGroup) {
        commitGroupRotate(cumulativeDelta);
      } else {
        commitUnitRotate(unitId, currentRotation);
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
        setGroupScaleDelta(cumulativeDelta);
      } else {
        currentScale = Math.min(Math.max(currentScale + dx * 0.01, 0.1), 5);
        setDragScale({ id: unitId, scale: currentScale });
      }
    };

    const handleMouseUp = () => {
      isDraggingUnit.current = false;
      setCursor("grab");
      if (isGroup) {
        commitGroupScale(cumulativeDelta);
      } else {
        commitUnitScale(unitId, currentScale);
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
              src={`${API_BASE_URL}/api/projects/${currentProjectName}/assets/${unit.assetType}/${unit.filename}`}
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
