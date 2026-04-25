import React, { useEffect, useRef, useState } from 'react';
import useMapFetch from '../hooks/useMapFetch';
import useMapInteraction from '../hooks/useMapInteraction';
import UnitLayer from './UnitLayer';
import { Unit } from '../types';
import API_BASE_URL from '../config/api';

interface MapCanvasProps {
  placedUnits: Unit[];
  onUnitDrag: (id: string, x: number, y: number) => void;
  onUnitMove: (id: string, x: number, y: number) => void;
  onUnitRotate: (id: string, rotation: number) => void;
  onUnitRotateCommit: (id: string, rotation: number) => void;
  onUnitScale: (id: string, scale: number) => void;
  onUnitScaleCommit: (id: string, scale: number) => void;
  onUnitSelect: (id: string | null, addToSelection?: boolean) => void;
  onBoxSelect: (ids: string[]) => void;
  selectedUnitIds: Set<string>;
}

function MapCanvas({ placedUnits, onUnitDrag, onUnitMove, onUnitRotate, onUnitRotateCommit, onUnitScale, onUnitScaleCommit, onUnitSelect, onBoxSelect, selectedUnitIds }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<number>(1) as React.RefObject<number>;
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 }) as React.RefObject<{ x: number; y: number }>;
  const isDraggingUnit = useRef<boolean>(false) as React.RefObject<boolean>;
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [isShiftHeld, setIsShiftHeld] = useState<boolean>(false);
  const [activeCursor, setActiveCursor] = useState<string>('grab');
  const svgContent = useMapFetch(`${API_BASE_URL}/api/map`);

  useEffect(() => {
    if (svgRef.current && svgContent) {
      svgRef.current.innerHTML = svgContent;
    }
  }, [svgContent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useMapInteraction(containerRef, mapRef, !!svgContent, scaleRef, isDraggingUnit, positionRef);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-unit]')) return;

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
        setSelectionBox(prev => prev ? { 
          ...prev, 
          endX: moveEvent.clientX - rect.left, 
          endY: moveEvent.clientY - rect.top 
        } : null);
      };

      const handleMouseUp = () => {
        setSelectionBox(prev => {
          if (!prev) return null;

          const scale = scaleRef.current ?? 1;
          const position = positionRef.current ?? { x: 0, y: 0 };

          // Convert screen space box to map space
          const left = (Math.min(prev.startX, prev.endX) - position.x) / scale;
          const right = (Math.max(prev.startX, prev.endX) - position.x) / scale;
          const top = (Math.min(prev.startY, prev.endY) - position.y) / scale;
          const bottom = (Math.max(prev.startY, prev.endY) - position.y) / scale;

          const selectedIds = placedUnits
            .filter(unit => unit.x >= left && unit.x <= right && unit.y >= top && unit.y <= bottom)
            .map(unit => unit.id);

          onBoxSelect(selectedIds);
          return null;
        });

        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      onUnitSelect(null);
    }
  };

  // Calculate selection box screen coordinates for rendering
  const boxStyle = selectionBox ? {
    left: Math.min(selectionBox.startX, selectionBox.endX),
    top: Math.min(selectionBox.startY, selectionBox.endY),
    width: Math.abs(selectionBox.endX - selectionBox.startX),
    height: Math.abs(selectionBox.endY - selectionBox.startY),
  } : null;

  const setCursor = (cursor: string) => {
    setActiveCursor(cursor);
    if (containerRef.current) {
      containerRef.current.style.cursor = cursor;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', cursor: isShiftHeld ? 'default' : activeCursor }}
      onMouseDown={handleMouseDown}
    >
      {(activeCursor === 'alias' || activeCursor === 'nwse-resize') && (
        <style>{`
          div, img { cursor: ${activeCursor} !important; }
        `}</style>
      )}
      {!svgContent && <p>Loading map...</p>}
      <div
        ref={mapRef}
        style={{
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        <div ref={svgRef} />
        <UnitLayer
          units={placedUnits}
          onUnitDrag={onUnitDrag}
          onUnitMove={onUnitMove}
          onUnitRotate={onUnitRotate}
          onUnitRotateCommit={onUnitRotateCommit}
          onUnitScale={onUnitScale}
          onUnitScaleCommit={onUnitScaleCommit}
          onUnitSelect={onUnitSelect}
          selectedUnitIds={selectedUnitIds}
          scaleRef={scaleRef}
          isDraggingUnit={isDraggingUnit}
          isShiftHeld={isShiftHeld}
          setCursor={setCursor}
        />
      </div>

      {/* Selection box overlay — rendered in screen space outside mapRef */}
      {boxStyle && (
        <div
          style={{
            position: 'absolute',
            left: boxStyle.left,
            top: boxStyle.top,
            width: boxStyle.width,
            height: boxStyle.height,
            border: '1px dashed #c8a84b',
            background: 'rgba(200, 168, 75, 0.1)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

export default MapCanvas;