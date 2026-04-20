import React from 'react';
import API_BASE_URL from '../config/api';
import { Unit } from '../types';

interface UnitLayerProps {
  units: Unit[];
  onUnitMove: (id: string, x: number, y: number) => void;
  scaleRef: React.RefObject<number>;
}

function UnitLayer({ units, onUnitMove, scaleRef }: UnitLayerProps) {
  const handleMouseDown = (e: React.MouseEvent, unitId: string) => {
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const unit = units.find(u => u.id === unitId);
    if (!unit) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const scale = scaleRef.current ?? 1;
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      onUnitMove(unitId, unit.x + dx, unit.y + dy);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {units.map(unit => (
        <img
          key={unit.id}
          src={`${API_BASE_URL}/api/assets/units/${unit.filename}`}
          alt={unit.filename}
          style={{
            position: 'absolute',
            left: unit.x,
            top: unit.y,
            width: '48px',
            height: '48px',
            cursor: 'move',
            pointerEvents: 'all',
            userSelect: 'none',
          }}
          onMouseDown={e => handleMouseDown(e, unit.id)}
          draggable={false}
        />
      ))}
    </div>
  );
}

export default UnitLayer;