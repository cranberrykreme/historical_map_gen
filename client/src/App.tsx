import React, { useEffect, useState } from 'react';
import MapCanvas from './components/MapCanvas';
import AssetImporter from './components/AssetImporter';
import UnitLayer from './components/UnitLayer';
import API_BASE_URL from './config/api';
import { AssetType, Unit } from './types';
import useAssetList from './hooks/useAssetList';

function App() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [placedUnits, setPlacedUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const { assets: units, refetch: refetchUnits } = useAssetList('units');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then(response => response.json())
      .then(data => setBackendStatus(data.message))
      .catch(() => setBackendStatus('Could not reach backend'));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedUnitId) {
          setPlacedUnits(prev => prev.filter(unit => unit.id !== selectedUnitId));
          setSelectedUnitId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUnitId]);

  const handleUploadComplete = (filename: string, type: AssetType) => {
    if (type === 'units' || type === 'portraits') {
      refetchUnits();
      const newUnit: Unit = {
        id: `${filename}-${Date.now()}`,
        filename,
        assetType: type,
        x: 100,
        y: 100,
        rotation: 0,
        scale: 1,
      };
      setPlacedUnits(prev => {
        return [...prev, newUnit];
      });
    }
  };

  const handleUnitMove = (id: string, x: number, y: number) => {
    setPlacedUnits(prev =>
      prev.map(unit => unit.id === id ? { ...unit, x, y } : unit)
    );
  };

  const handleUnitSelect = (id: string | null) => {
    setSelectedUnitId(id);
  };

  const handleUnitRotate = (id: string, rotation: number) => {
    setPlacedUnits(prev =>
      prev.map(unit => unit.id === id ? { ...unit, rotation } : unit)
    );
  };
  
  const handleUnitScale = (id: string, scale: number) => {
    setPlacedUnits(prev =>
      prev.map(unit => unit.id === id ? { ...unit, scale } : unit)
    );
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', flexShrink: 0 }}>
        <h1>HistoryMapTool</h1>
        <p>Backend status: {backendStatus}</p>
        <AssetImporter onUploadComplete={handleUploadComplete} />
      </div>
      <div style={{ position: 'relative', flex: 1 }}>
        <MapCanvas 
          placedUnits={placedUnits} 
          onUnitMove={handleUnitMove} 
          onUnitRotate={handleUnitRotate}
          onUnitScale={handleUnitScale}
          onUnitSelect={handleUnitSelect}
          selectedUnitId={selectedUnitId}
        />
      </div>
    </div>
  );
}

export default App;