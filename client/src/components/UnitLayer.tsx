import React from 'react';
import API_BASE_URL from '../config/api';
import { Unit } from '../types';

interface UnitLayerProps {
    units: Unit[];
    onUnitMove: (id: string, x: number, y: number) => void;
    scaleRef: React.RefObject<number>;
    isDraggingUnit: React.RefObject<boolean>;
  }
  
  function UnitLayer({ units, onUnitMove, scaleRef, isDraggingUnit }: UnitLayerProps) {
    const handleMouseDown = (e: React.MouseEvent, unitId: string) => {
        e.stopPropagation();
        isDraggingUnit.current = true;

        const unit = units.find(u => u.id === unitId);
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
            onUnitMove(unitId, currentX, currentY);
        };

        const handleMouseUp = () => {
            isDraggingUnit.current = false;
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