import React, { useEffect, useRef } from 'react';
import useMapFetch from '../hooks/useMapFetch';
import useMapInteraction from '../hooks/useMapInteraction';

function MapCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const svgContent = useMapFetch('http://localhost:5000/api/map');

    useEffect(() => {
        if (mapRef.current && svgContent) {
            mapRef.current.innerHTML = svgContent;
        }
    }, [svgContent]);

    useMapInteraction(containerRef, mapRef, !!svgContent)

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