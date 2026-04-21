import React from 'react';
import API_BASE_URL from '../config/api';
import { Unit } from '../types';

interface UnitLayerProps {
    units: Unit[];
    onUnitMove: (id: string, x: number, y: number) => void;
    onUnitRotate: (id: string, rotation: number) => void;
    onUnitScale: (id: string, scale: number) => void;
    onUnitSelect: (id: string | null) => void;
    selectedUnitId: string | null;
    scaleRef: React.RefObject<number>;
    isDraggingUnit: React.RefObject<boolean>;
  }
  
  function UnitLayer({ units, onUnitMove, onUnitRotate, onUnitScale, onUnitSelect, selectedUnitId, scaleRef, isDraggingUnit }: UnitLayerProps) {
    const handleMouseDown = (e: React.MouseEvent, unitId: string) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        isDraggingUnit.current = true;
        onUnitSelect(unitId);

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

    const handleRotateHandleMouseDown = (e: React.MouseEvent, unitId: string) => {
        e.stopPropagation();
        e.preventDefault();
        isDraggingUnit.current = true;

        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        let currentRotation = unit.rotation;
        let lastX = e.clientX;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - lastX;
            lastX = moveEvent.clientX;
            currentRotation += dx;
            onUnitRotate(unitId, currentRotation);
        };

        const handleMouseUp = () => {
            isDraggingUnit.current = false;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleScaleHandleMouseDown = (e: React.MouseEvent, unitId: string) => {
        e.stopPropagation();
        e.preventDefault();
        isDraggingUnit.current = true;

        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        let currentScale = unit.scale;
        let lastX = e.clientX;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - lastX;
            lastX = moveEvent.clientX;
            currentScale = Math.min(Math.max(currentScale + (dx * 0.01), 0.1), 5);
            onUnitScale(unitId, currentScale);
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
      {units.map(unit => {
        const isSelected = unit.id === selectedUnitId;
        return (
            <div 
                key={unit.id}
                data-unit="true"
                style={{
                    position: 'absolute',
                    left: unit.x,
                    top: unit.y,
                    transform: `translate(50%,50%) rotate(${unit.rotation}deg) scale(${unit.scale})`,
                    transformOrigin: 'center center',
                    pointerEvents: 'all',
                    zIndex: isSelected ? 1000 : 1,
                }}
            >
                <img
                    src={`${API_BASE_URL}/api/assets/${unit.assetType}/${unit.filename}`}
                    alt={unit.filename}
                    style={{
                        width: '48px',
                        height: 'auto',
                        cursor: 'move',
                        userSelect: 'none',
                        display: 'block',
                        outline: isSelected ? '2px solid #c8a84b' : 'none',
                    }}
                    onMouseDown={e => handleMouseDown(e, unit.id)}
                    draggable={false}
                />
                {isSelected && (
                    <>
                        {/* Rotation handle - above the unit */}
                        <div 
                            onMouseDown={e => handleRotateHandleMouseDown(e, unit.id)}
                            style={{
                                position: 'absolute',
                                top: '-24px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#c8a84b',
                                cursor: 'crosshair',
                                pointerEvents: 'all',
                            }}
                        />
                        {/* Scale handle - bottom right of the unit */}
                        <div
                            onMouseDown={e => handleScaleHandleMouseDown(e, unit.id)}
                            style={{
                                position: 'absolute',
                                bottom: '-6px',
                                right: '-6px',
                                width: '12px',
                                height: '12px',
                                background: '#c8a84b',
                                cursor: 'nwse-resize',
                                pointerEvents: 'all',
                              }}
                        />
                    </>
                )}
            </div>
        )})}
    </div>
  );
}

export default UnitLayer;