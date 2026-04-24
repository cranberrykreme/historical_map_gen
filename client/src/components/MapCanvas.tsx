import React, { useEffect, useRef } from 'react';
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
  onUnitSelect: (id: string | null) => void;
  selectedUnitId: string | null;
}

function MapCanvas({ placedUnits, onUnitDrag, onUnitMove, onUnitRotate, onUnitRotateCommit, onUnitScale, onUnitScaleCommit, onUnitSelect, selectedUnitId }: MapCanvasProps) {  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<number>(1) as React.RefObject<number>;
  const isDraggingUnit = useRef<boolean>(false) as React.RefObject<boolean>;
  const svgContent = useMapFetch(`${API_BASE_URL}/api/map`);


  useEffect(() => {
    if (svgRef.current && svgContent) {
      svgRef.current.innerHTML = svgContent;
    }
  }, [svgContent]);

  useMapInteraction(containerRef, mapRef, !!svgContent, scaleRef, isDraggingUnit);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', cursor: 'grab' }}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-unit]')) {
          onUnitSelect(null)
        }
      }}
    >
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
            selectedUnitId={selectedUnitId}
            scaleRef={scaleRef}
            isDraggingUnit={isDraggingUnit}
          />     
        </div>
    </div>
  );
}

export default MapCanvas;