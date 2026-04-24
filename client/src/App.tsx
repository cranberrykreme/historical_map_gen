import React, { useEffect, useState } from 'react';
import MapCanvas from './components/MapCanvas';
import AssetImporter from './components/AssetImporter';
import API_BASE_URL from './config/api';
import { AssetType, Unit } from './types';
import useAssetList from './hooks/useAssetList';
import useProject from './hooks/useProject';
import useHistory from './hooks/useHistory';

function App() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{id: string, x: number, y: number} | null>(null);
  const [dragRotation, setDragRotation] = useState<{id: string, rotation: number} | null>(null);
  const [dragScale, setDragScale] = useState<{id: string, scale: number} | null>(null);
  const { present: placedUnits, set: setPlacedUnits, undo, redo } = useHistory<Unit[]>([]);
  const { refetch: refetchUnits } = useAssetList('units');
  const { saveProject, loadProject } = useProject('default');

  // useEffect for checking health of backend system.
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then(response => response.json())
      .then(data => setBackendStatus(data.message))
      .catch(() => setBackendStatus('Could not reach backend'));
  }, []);

  // useEffect for deleting units. Also handles undo, redo.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedUnitId) {
          setPlacedUnits(placedUnits.filter(unit => unit.id !== selectedUnitId));
          setSelectedUnitId(null);
        }
      }

      if (e.metaKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      } else if (e.metaKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUnitId, placedUnits, undo, redo]);

  // useEffect for placing units from a loaded project.
  useEffect(() => {
    loadProject().then(units => {
      if (units.length > 0) {
        setPlacedUnits(units);
      }
    });
  }, []);

  // useEffect for saving unit locations to project.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 's' && e.metaKey) { // cmd + s
        e.preventDefault();
        saveProject(placedUnits);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [placedUnits, saveProject]);

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
      setPlacedUnits([...placedUnits, newUnit]);
    }
  };

  const handleUnitDrag = (id: string, x: number, y: number) => {
    setDragPosition(null);
    setDragPosition({id, x, y});
  };

  const handleUnitMove = (id: string, x: number, y: number) => {
    setDragPosition(null);
    setPlacedUnits(placedUnits.map(unit => unit.id === id ? { ...unit, x, y } : unit));
  };

  const handleUnitSelect = (id: string | null) => {
    setSelectedUnitId(id);
  };

  const handleUnitRotate = (id: string, rotation: number) => {
    setDragRotation({ id, rotation });
  };
  
  const handleUnitRotateCommit = (id: string, rotation: number) => {
    setDragRotation(null);
    setPlacedUnits(placedUnits.map(unit => unit.id === id ? { ...unit, rotation } : unit));
  };
  
  const handleUnitScale = (id: string, scale: number) => {
    setDragScale({ id, scale });
  };
  
  const handleUnitScaleCommit = (id: string, scale: number) => {
    setDragScale(null);
    setPlacedUnits(placedUnits.map(unit => unit.id === id ? { ...unit, scale } : unit));
  };

  const displayUnits = placedUnits.map(unit => {
    let display = { ...unit };
    if (dragPosition && dragPosition.id === unit.id) {
      display.x = dragPosition.x;
      display.y = dragPosition.y;
    }
    if (dragRotation && dragRotation.id === unit.id) {
      display.rotation = dragRotation.rotation;
    }
    if (dragScale && dragScale.id === unit.id) {
      display.scale = dragScale.scale;
    }
    return display;
  });

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', flexShrink: 0 }}>
        <h1>HistoryMapTool</h1>
        <p>Backend status: {backendStatus}</p>
        <AssetImporter onUploadComplete={handleUploadComplete} />
      </div>
      <div style={{ position: 'relative', flex: 1 }}>
        <MapCanvas
          placedUnits={displayUnits}
          onUnitDrag={handleUnitDrag}
          onUnitMove={handleUnitMove}
          onUnitRotate={handleUnitRotate}
          onUnitRotateCommit={handleUnitRotateCommit}
          onUnitScale={handleUnitScale}
          onUnitScaleCommit={handleUnitScaleCommit}
          onUnitSelect={handleUnitSelect}
          selectedUnitId={selectedUnitId}
        />
      </div>
    </div>
  );
}

export default App;