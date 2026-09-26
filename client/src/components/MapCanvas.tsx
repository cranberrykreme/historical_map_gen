import React, { useEffect, useRef, useState } from "react";
import useMapFetch from "../hooks/useMapFetch";
import useMapInteraction from "../hooks/useMapInteraction";
import useSelectionBox from "../hooks/useSelectionBox";
import useAssetDrop from "../hooks/useAssetDrop";
import UnitLayer from "./UnitLayer";
import API_BASE_URL from "../config/api";
import { useMapStore } from "../store/useMapStore";
import { useAssetStore } from "../store/useAssetStore";

function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<number>(1);
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingUnit = useRef<boolean>(false);
  const [isShiftHeld, setIsShiftHeld] = useState<boolean>(false);
  const [activeCursor, setActiveCursor] = useState<string>("grab");

  const selectedMapFilename = useMapStore((state) => state.selectedMapFilename);
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const svgContent = useMapFetch(
    selectedMapFilename && currentProjectName
      ? `${API_BASE_URL}/api/projects/${currentProjectName}/map?filename=${selectedMapFilename}`
      : null
  );
  const boxSelect = useMapStore((state) => state.boxSelect);
  const selectUnit = useMapStore((state) => state.selectUnit);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const dragPosition = useMapStore((state) => state.dragPosition);
  const dragRotation = useMapStore((state) => state.dragRotation);
  const dragScale = useMapStore((state) => state.dragScale);
  const groupDragDelta = useMapStore((state) => state.groupDragDelta);
  const groupRotateDelta = useMapStore((state) => state.groupRotateDelta);
  const groupScaleDelta = useMapStore((state) => state.groupScaleDelta);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const addUnitAtPosition = useMapStore((state) => state.addUnitAtPosition);

  const displayUnits = placedUnits.map((unit) => {
    let display = { ...unit };
    if (dragPosition && dragPosition.id === unit.id) {
      display.x = dragPosition.x;
      display.y = dragPosition.y;
    }
    if (dragRotation && dragRotation.id === unit.id) {
      display.rotation = dragRotation.rotation;
    }
    if (dragScale && dragScale.id === unit.id) {
      display.scale = dragScale.scale;
    }
    if (groupDragDelta && selectedUnitIds.has(unit.id)) {
      display.x = unit.x + groupDragDelta.dx;
      display.y = unit.y + groupDragDelta.dy;
    }
    if (groupRotateDelta !== null && selectedUnitIds.has(unit.id)) {
      display.rotation = unit.rotation + groupRotateDelta;
    }
    if (groupScaleDelta !== null && selectedUnitIds.has(unit.id)) {
      display.scale = Math.min(Math.max(unit.scale + groupScaleDelta, 0.1), 5);
    }
    return display;
  });

  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.innerHTML = svgContent ?? "";
    }
  }, [svgContent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftHeld(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useMapInteraction(
    containerRef,
    mapRef,
    true,
    scaleRef,
    isDraggingUnit,
    positionRef
  );

  const { startSelection, boxStyle } = useSelectionBox({
    containerRef,
    scaleRef,
    positionRef,
    displayUnits,
    boxSelect,
  });

  const { handleDragOver, handleDrop } = useAssetDrop({
    containerRef,
    scaleRef,
    positionRef,
    addUnitAtPosition,
  });

  const setCursor = (cursor: string) => {
    setActiveCursor(cursor);
    if (containerRef.current) {
      containerRef.current.style.cursor = cursor;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-unit]")) return;

    if (e.shiftKey) {
      startSelection(e);
    } else {
      selectUnit(null);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: isShiftHeld ? "default" : activeCursor,
        background: selectedMapFilename ? "transparent" : "#3a3a3a",
      }}
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {(activeCursor === "alias" || activeCursor === "nwse-resize") && (
        <style>{`div, img { cursor: ${activeCursor} !important; }`}</style>
      )}
      {selectedMapFilename && !svgContent && <p>Loading map...</p>}
      <div
        ref={mapRef}
        style={{ transformOrigin: "0 0", willChange: "transform" }}
      >
        <div ref={svgRef} />
        <UnitLayer
          units={displayUnits}
          scaleRef={scaleRef}
          isDraggingUnit={isDraggingUnit}
          isShiftHeld={isShiftHeld}
          setCursor={setCursor}
        />
      </div>
      {boxStyle && (
        <div
          style={{
            position: "absolute",
            left: boxStyle.left,
            top: boxStyle.top,
            width: boxStyle.width,
            height: boxStyle.height,
            border: "1px dashed #c8a84b",
            background: "rgba(200, 168, 75, 0.1)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

export default MapCanvas;
