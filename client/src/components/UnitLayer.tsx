import React, { useState } from "react";
import API_BASE_URL from "../config/api";
import { FormationBlock, Unit } from "../types";
import { useMapStore } from "../store/useMapStore";
import { useAssetStore } from "../store/useAssetStore";
import { usePathToolStore } from "../store/usePathToolStore";
import {
  effectiveForward,
  forwardFromPointer,
  unitFacing,
} from "../utils/unitFacing";
import {
  BlockHandle,
  blockBox,
  blockHandles,
  dragBlockHandle,
} from "../utils/blocks";
import { ExitFrame, UNIT_IMAGE_WIDTH } from "../utils/exits";
import BlockShape from "./BlockShape";
import ExitPieces from "./exits/ExitPieces";

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
  // Units part way through leaving (dying), drawn under the rest in pieces. They can't be
  // selected or moved.
  leaving: { unit: Unit; frame: ExitFrame }[];
}

const ARROW_LENGTH = 64; // in the unit's own space, so it scales with the unit
const GOLD = "#c8a84b";
const FADED_OPACITY = 0.35; // while a path is being drawn or a point dragged

function UnitLayer({
  units,
  scaleRef,
  isDraggingUnit,
  isShiftHeld,
  setCursor,
  lockedIds,
  leaving,
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
  const updateBlock = useMapStore((state) => state.updateBlock);

  // While a path is being drawn or one of its points dragged, units fade so you can see the
  // map underneath and place the point exactly
  const pathEditing = usePathToolStore(
    (state) => state.drawingPoints !== null || state.draftPath !== null
  );

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
      {leaving.map(({ unit, frame }) => (
        <div
          key={`leaving-${unit.id}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(${unit.x}px, ${unit.y}px) translate(-50%, -50%) rotate(${unit.rotation}deg) scale(${unit.scale})`,
            transformOrigin: "center center",
            pointerEvents: "none",
          }}
        >
          <ExitPieces
            frame={frame}
            width={unit.block ? blockBox(unit.block).width : UNIT_IMAGE_WIDTH}
          >
            {unit.block ? (
              <BlockShape block={unit.block} rotation={unit.rotation} />
            ) : (
              <img
                src={`${API_BASE_URL}/api/projects/${currentProjectName}/assets/${unit.assetType}/${unit.path ?? unit.filename}`}
                alt=""
                draggable={false}
                style={{
                  width: `${UNIT_IMAGE_WIDTH}px`,
                  height: "auto",
                  display: "block",
                  userSelect: "none",
                  transform: unit.flipped ? "scaleX(-1)" : undefined,
                }}
              />
            )}
          </ExitPieces>
        </div>
      ))}
      {units.map((unit) => {
        const isSelected = selectedUnitIds.has(unit.id);
        const locked = lockedIds.has(unit.id);
        const block =
          unit.block && blockDraft?.id === unit.id
            ? blockDraft.block
            : unit.block;
        const showForward =
          isSelected && selectedUnitIds.size === 1 && !locked && !block;
        const showBlockHandles =
          !!block && isSelected && selectedUnitIds.size === 1 && !locked;
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
            {block ? (
              // A formation block: drawn rather than a picture, and never mirrored
              <BlockShape
                block={block}
                rotation={unit.rotation}
                selected={isSelected}
                style={{
                  cursor: isShiftHeld || locked ? "default" : "move",
                  userSelect: "none",
                }}
                onMouseDown={(e) => handleMouseDown(e, unit.id)}
              >
                {showBlockHandles &&
                  (
                    Object.entries(blockHandles(block)) as [
                      BlockHandle,
                      { x: number; y: number },
                    ][]
                  ).map(([handle, at]) => (
                    <g key={handle}>
                      <title>
                        {handle === "front"
                          ? "Drag to bend the block (back to the middle to straighten it)"
                          : handle === "back"
                            ? "Drag to make the block deeper or shallower"
                            : "Drag to make the block wider or narrower"}
                      </title>
                      {handle === "front" ? (
                        <rect
                          x={at.x - 5}
                          y={at.y - 5}
                          width={10}
                          height={10}
                          transform={`rotate(45 ${at.x} ${at.y})`}
                          fill={GOLD}
                          stroke="#1a1225"
                          strokeWidth={1}
                          style={{ cursor: "ns-resize", pointerEvents: "all" }}
                          onMouseDown={(e) =>
                            handleBlockHandleMouseDown(e, unit, handle)
                          }
                        />
                      ) : (
                        <circle
                          cx={at.x}
                          cy={at.y}
                          r={6}
                          fill="#fff"
                          stroke={GOLD}
                          strokeWidth={2}
                          style={{
                            cursor:
                              handle === "back" ? "ns-resize" : "ew-resize",
                            pointerEvents: "all",
                          }}
                          onMouseDown={(e) =>
                            handleBlockHandleMouseDown(e, unit, handle)
                          }
                        />
                      )}
                    </g>
                  ))}
              </BlockShape>
            ) : (
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
            )}

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
                {/* A block is sized with its own handles instead */}
                {!block && (
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
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default UnitLayer;
