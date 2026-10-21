import React from "react";
import API_BASE_URL from "../../config/api";
import { Unit } from "../../types";
import { useAssetStore } from "../../store/useAssetStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { effectiveForward, unitFacing } from "../../utils/marches/unitFacing";
import { ExitFrame } from "../../utils/units/exits";
import BlockShape from "./BlockShape";
import BlockHandles from "./BlockHandles";
import ForwardArrow from "./ForwardArrow";
import LeavingUnit from "./LeavingUnit";
import TurnAndSizeHandles from "./TurnAndSizeHandles";
import { UNIT_TILT } from "./unitLook";
import { useUnitDrags } from "./useUnitDrags";

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
  const {
    selectedUnitIds,
    blockDraft,
    forwardDraft,
    handleMouseDown,
    handleRotateHandleMouseDown,
    handleScaleHandleMouseDown,
    handleForwardHandleMouseDown,
    handleBlockHandleMouseDown,
  } = useUnitDrags({ units, scaleRef, isDraggingUnit, setCursor, lockedIds });

  // While a path is being drawn or one of its points dragged, units fade so you can see the
  // map underneath and place the point exactly
  const pathEditing = usePathToolStore(
    (state) => state.drawingPoints !== null || state.draftPath !== null
  );

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
        <LeavingUnit
          key={`leaving-${unit.id}`}
          unit={unit}
          frame={frame}
          projectName={currentProjectName}
        />
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
              transform: `translate(${unit.x}px, ${unit.y}px) translate(-50%, -50%) rotate(${unit.rotation + UNIT_TILT}deg) scale(${unit.scale})`,
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
                {showBlockHandles && (
                  <BlockHandles
                    block={block}
                    onHandleMouseDown={(e, handle) =>
                      handleBlockHandleMouseDown(e, unit, handle)
                    }
                  />
                )}
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
              <ForwardArrow
                angle={arrowAngle}
                isShiftHeld={isShiftHeld}
                onMouseDown={(e) => handleForwardHandleMouseDown(e, unit)}
              />
            )}

            {isSelected && !locked && (
              <TurnAndSizeHandles
                // A block is sized with its own handles instead
                canScale={!block}
                isShiftHeld={isShiftHeld}
                onRotate={(e) => handleRotateHandleMouseDown(e, unit.id)}
                onScale={(e) => handleScaleHandleMouseDown(e, unit.id)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default UnitLayer;
