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
  const { assets: units, refetch: refetchUnits } = useAssetList('units');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then(response => response.json())
      .then(data => setBackendStatus(data.message))
      .catch(() => setBackendStatus('Could not reach backend'));
  }, []);

  const handleUploadComplete = (filename: string, type: AssetType) => {
    console.log('Upload complete called with:', filename, type);
    if (type === 'units') {
      refetchUnits();
      const newUnit: Unit = {
        id: `${filename}-${Date.now()}`,
        filename,
        x: 100,
        y: 100,
      };
      console.log('New unit created:', newUnit);
      setPlacedUnits(prev => {
        console.log('Previous placed units:', prev);
        return [...prev, newUnit];
      });
    }
  };

  const handleUnitMove = (id: string, x: number, y: number) => {
    setPlacedUnits(prev =>
      prev.map(unit => unit.id === id ? { ...unit, x, y } : unit)
    );
  };

  console.log('Rendering with placedUnits:', placedUnits)
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', flexShrink: 0 }}>
        <h1>HistoryMapTool</h1>
        <p>Backend status: {backendStatus}</p>
        <AssetImporter onUploadComplete={handleUploadComplete} />
      </div>
      <div style={{ position: 'relative', flex: 1 }}>
        <MapCanvas placedUnits={placedUnits} onUnitMove={handleUnitMove} />
      </div>
    </div>
  );
}

export default App;