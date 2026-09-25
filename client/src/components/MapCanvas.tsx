import React, { useEffect, useRef, useState } from "react";
import useMapFetch from "../hooks/useMapFetch";
import useMapInteraction from "../hooks/useMapInteraction";
import UnitLayer from "./UnitLayer";
import API_BASE_URL from "../config/api";
import { useMapStore } from "../store/useMapStore";
import { AssetType } from "../types";

function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<number>(1);
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingUnit = useRef<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [isShiftHeld, setIsShiftHeld] = useState<boolean>(false);
  const [activeCursor, setActiveCursor] = useState<string>("grab");

  const svgContent = useMapFetch(`${API_BASE_URL}/api/map`);
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
    if (svgRef.current && svgContent) {
      svgRef.current.innerHTML = svgContent;
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
    !!svgContent,
    scaleRef,
    isDraggingUnit,
    positionRef
  );

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
    } else {
      selectUnit(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;

    try {
      const { filename, assetType } = JSON.parse(data) as {
        filename: string;
        assetType: AssetType;
      };
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const scale = scaleRef.current ?? 1;
      const position = positionRef.current ?? { x: 0, y: 0 };

      const mapX = (screenX - position.x) / scale;
      const mapY = (screenY - position.y) / scale;

      addUnitAtPosition(filename, assetType, mapX, mapY);
    } catch (error) {
      console.error("Failed to parse drop data:", error);
    }
  };

  const boxStyle = selectionBox
    ? {
        left: Math.min(selectionBox.startX, selectionBox.endX),
        top: Math.min(selectionBox.startY, selectionBox.endY),
        width: Math.abs(selectionBox.endX - selectionBox.startX),
        height: Math.abs(selectionBox.endY - selectionBox.startY),
      }
    : null;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: isShiftHeld ? "default" : activeCursor,
      }}
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {(activeCursor === "alias" || activeCursor === "nwse-resize") && (
        <style>{`div, img { cursor: ${activeCursor} !important; }`}</style>
      )}
      {!svgContent && <p>Loading map...</p>}
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
