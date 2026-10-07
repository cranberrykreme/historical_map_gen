import React, { useState } from "react";
import API_BASE_URL from "../config/api";
import { Unit } from "../types";
import { useMapStore } from "../store/useMapStore";
import { useAssetStore } from "../store/useAssetStore";
import { usePathToolStore } from "../store/usePathToolStore";
import {
  effectiveForward,
  forwardFromPointer,
  unitFacing,
} from "../utils/unitFacing";

interface UnitLayerProps {
  units: Unit[];
  scaleRef: React.RefObject<number>;
  isDraggingUnit: React.RefObject<boolean>;
  isShiftHeld: boolean;
  setCursor: (cursor: string) => void;
  // Units that can't be moved, turned or resized with the playhead where it is: each unit is
  // edited at its own moment (the story's start, or when it appears). Locked units can still
  // be selected, so they can be deleted (they leave then) or looked at in the Paths panel.
  lockedIds: ReadonlySet<string>;
}

const ARROW_LENGTH = 64; // in the unit's own space, so it scales with the unit
const FADED_OPACITY = 0.35; // while a path is being drawn or a point dragged

function UnitLayer({
  units,
  scaleRef,
  isDraggingUnit,
  isShiftHeld,
  setCursor,
  lockedIds,
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
  const setUnitForward = useMapStore((state) => state.setUnitForward);

  // While a path is being drawn or one of its points dragged, units fade so you can see the
  // map underneath and place the point exactly
  const pathEditing = usePathToolStore(
    (state) => state.drawingPoints !== null || state.draftPath !== null
  );

  // The arrow shows the angle being dragged before it is committed
  const [forwardDraft, setForwardDraft] = useState<{
    id: string;
    angle: number;
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, unitId: string) => {
    if (e.button !== 0) return;
    if (e.shiftKey) {
      selectUnit(unitId, true);
      return;
    }
    e.stopPropagation();
    e.preventDefault();

    // A locked unit is only selected, never dragged
    if (lockedIds.has(unitId)) {
      selectUnit(unitId, false);
      return;
    }
    isDraggingUnit.current = true;

    // The whole selection moves together only if every unit in it can be moved now
    const groupMovable = Array.from(selectedUnitIds).every(
      (id) => !lockedIds.has(id)
    );
    if (
      selectedUnitIds.size > 1 &&
      selectedUnitIds.has(unitId) &&
      groupMovable
    ) {
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

  const handleForwardHandleMouseDown = (e: React.MouseEvent, unit: Unit) => {
    if (e.button !== 0 || e.shiftKey) return;
    e.stopPropagation();
    e.preventDefault();

    // The unit's centre on screen: the arrow angle is measured from here
    const wrapper = (e.currentTarget as HTMLElement).closest("[data-unit]");
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    isDraggingUnit.current = true; // stops the map from panning under the drag
    const start = unitFacing(unit).forwardAngle;
    let latest = start;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      latest = forwardFromPointer(
        moveEvent.clientX - centerX,
        moveEvent.clientY - centerY,
        unit.rotation,
        !!unit.flipped
      );
      setForwardDraft({ id: unit.id, angle: latest });
    };

    const handleMouseUp = () => {
      isDraggingUnit.current = false;
      setForwardDraft(null);
      if (latest !== start) setUnitForward(unit.id, latest);
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
        opacity: pathEditing ? FADED_OPACITY : 1,
        transition: "opacity 120ms ease",
      }}
    >
      {units.map((unit) => {
        const isSelected = selectedUnitIds.has(unit.id);
        const locked = lockedIds.has(unit.id);
        const showForward = isSelected && selectedUnitIds.size === 1 && !locked;
        const forwardAngle =
          forwardDraft && forwardDraft.id === unit.id
            ? forwardDraft.angle
            : unitFacing(unit).forwardAngle;
        const arrowAngle = effectiveForward(forwardAngle, !!unit.flipped);
        return (
          <div
            key={unit.id}
            data-unit="true"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translate(${unit.x}px, ${unit.y}px) translate(-50%, -50%) rotate(${unit.rotation}deg) scale(${unit.scale})`,
              transformOrigin: "center center",
              pointerEvents: "all",
              zIndex: isSelected ? 1000 : 1,
            }}
          >
            <img
              src={`${API_BASE_URL}/api/projects/${currentProjectName}/assets/${unit.assetType}/${unit.path ?? unit.filename}`}
              alt={unit.filename}
              style={{
                width: "48px",
                height: "auto",
                cursor: isShiftHeld || locked ? "default" : "move",
                userSelect: "none",
                display: "block",
                transform: unit.flipped ? "scaleX(-1)" : undefined,
                outline: isSelected ? "2px solid #c8a84b" : "none",
              }}
              onMouseDown={(e) => handleMouseDown(e, unit.id)}
              draggable={false}
            />

            {/* Forwards arrow (drawn before the other handles so they stay on top) */}
            {showForward && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 0,
                  height: 0,
                  transform: `rotate(${arrowAngle}deg)`,
                  pointerEvents: "none",
                  filter: "drop-shadow(0 0 1px rgba(26, 18, 37, 0.9))",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: -1,
                    width: ARROW_LENGTH,
                    height: 2,
                    background: "#c8a84b",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: ARROW_LENGTH - 2,
                    top: -6,
                    width: 0,
                    height: 0,
                    borderTop: "6px solid transparent",
                    borderBottom: "6px solid transparent",
                    borderLeft: "10px solid #c8a84b",
                    pointerEvents: "none",
                  }}
                />
                <div
                  title="Drag to set which way this unit faces"
                  onMouseDown={(e) => handleForwardHandleMouseDown(e, unit)}
                  style={{
                    position: "absolute",
                    left: ARROW_LENGTH - 9,
                    top: -12,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    cursor: isShiftHeld ? "default" : "grab",
                    pointerEvents: "all",
                  }}
                />
              </div>
            )}

            {isSelected && !locked && (
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
