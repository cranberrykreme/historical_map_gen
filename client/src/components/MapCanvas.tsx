import e from 'express';
import React, { useState, useEffect, useRef } from 'react';

function MapCanvas() {
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const scaleRef = useRef<number>(1);
    const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const isPanningRef = useRef<boolean>(false);
    const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        fetch('http://localhost:5000/api/map')
            .then(response => response.text())
            .then(data => setSvgContent(data))
            .catch(() => console.error('could not load map'));
    }, []);

    useEffect(() => {
        if (mapRef.current && svgContent) {
            mapRef.current.innerHTML = svgContent;
        }
    }, [svgContent]);

    const applyTransform = () => {
        if (!mapRef.current) return;
        const { x, y } = positionRef.current;
        const scale = scaleRef.current;
        mapRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const prevScale = scaleRef.current;
            const delta = e.deltaY * -0.001;
            const newScale = Math.min(Math.max(prevScale + delta, 0.3), 10);

            const { x, y } = positionRef.current;
            positionRef.current = {
                x: mouseX - (mouseX - x) * (newScale / prevScale),
                y: mouseY - (mouseY - y) * (newScale / prevScale),
            };

            scaleRef.current = newScale;
            applyTransform();
        };

        const handleMouseDown = (e: MouseEvent) => {
            isPanningRef.current = true;
            panStartRef.current = {
                x: e.clientX - positionRef.current.x,
                y: e.clientY - positionRef.current.y,
            };
            container.style.cursor = 'grabbing';
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isPanningRef.current) return;
            positionRef.current = {
                x: e.clientX - panStartRef.current.x,
                y: e.clientY - panStartRef.current.y,
            };
            applyTransform();
        };

        const handleMouseUp = () => {
            isPanningRef.current = false;
            container.style.cursor = 'grab';
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('mousedown', handleMouseDown);
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('mouseleave', handleMouseUp);
    
        return () => {
          container.removeEventListener('wheel', handleWheel);
          container.removeEventListener('mousedown', handleMouseDown);
          container.removeEventListener('mousemove', handleMouseMove);
          container.removeEventListener('mouseup', handleMouseUp);
          container.removeEventListener('mouseleave', handleMouseUp);
        };
    }, [svgContent]);

    return (
        <div
          ref={containerRef}
          style={{ width: '100vw', height: '100vh', overflow: 'hidden', cursor: 'grab' }}
        >
          {!svgContent && <p>Loading map...</p>}
          <div
            ref={mapRef}
            style={{
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
          />
        </div>
      );
}

export default MapCanvas;