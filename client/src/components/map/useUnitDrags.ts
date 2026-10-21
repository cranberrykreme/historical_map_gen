import React, { useState } from "react";
import { FormationBlock, Unit } from "../../types";
import { useMapStore } from "../../store/useMapStore";
import { forwardFromPointer, unitFacing } from "../../utils/marches/unitFacing";
import { BlockHandle, dragBlockHandle } from "../../utils/units/blocks";

// Dragging units on the map: moving, turning and resizing one unit or the whole selection,
// setting which way a unit faces, and reshaping a formation block. Each drag is one undo
// step when it's let go.
export function useUnitDrags({
  units,
  scaleRef,
  isDraggingUnit,
  setCursor,
  lockedIds,
}: {
  units: Unit[];
  scaleRef: React.RefObject<number>;
  isDraggingUnit: React.RefObject<boolean>;
  setCursor: (cursor: string) => void;
  lockedIds: ReadonlySet<string>;
}) {
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
  const updateBlock = useMapStore((state) => state.updateBlock);

  // A formation block being reshaped by one of its handles, before it's committed
  const [blockDraft, setBlockDraft] = useState<{
    id: string;
    block: FormationBlock;
  } | null>(null);

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

  // Drags one of a formation block's handles: the sides widen it, the back deepens it, the
  // front bends it. One undo step when it's let go.
  const handleBlockHandleMouseDown = (
    e: React.MouseEvent,
    unit: Unit,
    handle: BlockHandle
  ) => {
    if (e.button !== 0 || e.shiftKey || !unit.block) return;
    e.stopPropagation();
    e.preventDefault();
    const wrapper = (e.currentTarget as Element).closest("[data-unit]");
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    isDraggingUnit.current = true;
    const original = unit.block;
    let latest = original;
    const turn = (-unit.rotation * Math.PI) / 180;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // the pointer in the block's own space: unturned and unscaled
      const k = (scaleRef.current ?? 1) * unit.scale;
      const dx = (moveEvent.clientX - centerX) / k;
      const dy = (moveEvent.clientY - centerY) / k;
      const at = {
        x: dx * Math.cos(turn) - dy * Math.sin(turn),
        y: dx * Math.sin(turn) + dy * Math.cos(turn),
      };
      latest = dragBlockHandle(original, handle, at);
      setBlockDraft({ id: unit.id, block: latest });
    };

    const handleMouseUp = () => {
      isDraggingUnit.current = false;
      setBlockDraft(null);
      if (latest !== original) updateBlock(unit.id, latest);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return {
    selectedUnitIds,
    blockDraft,
    forwardDraft,
    handleMouseDown,
    handleRotateHandleMouseDown,
    handleScaleHandleMouseDown,
    handleForwardHandleMouseDown,
    handleBlockHandleMouseDown,
  };
}
