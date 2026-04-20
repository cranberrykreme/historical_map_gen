import React, { useEffect, useRef } from 'react';
import useMapFetch from '../hooks/useMapFetch';
import useMapInteraction from '../hooks/useMapInteraction';
import UnitLayer from './UnitLayer';
import { Unit } from '../types';
import API_BASE_URL from '../config/api';

interface MapCanvasProps {
  placedUnits: Unit[];
  onUnitMove: (id: string, x: number, y: number) => void;
}

function MapCanvas({ placedUnits, onUnitMove }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const svgContent = useMapFetch(`${API_BASE_URL}/api/map`);
  const { scaleRef } = useMapInteraction(containerRef, mapRef, !!svgContent);

  useEffect(() => {
    if (svgRef.current && svgContent) {
      svgRef.current.innerHTML = svgContent;
    }
  }, [svgContent]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', cursor: 'grab' }}
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
        <UnitLayer units={placedUnits} onUnitMove={onUnitMove} scaleRef={scaleRef} />
      </div>
    </div>
  );
}

export default MapCanvas;