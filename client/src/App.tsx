import React, { useEffect, useState, useRef } from "react";
import MapCanvas from "./components/MapCanvas";
import AssetImporter from "./components/AssetImporter";
import API_BASE_URL from "./config/api";
import { AssetType, Unit } from "./types";
import useAssetList from "./hooks/useAssetList";
import useProject from "./hooks/useProject";
import useHistory from "./hooks/useHistory";

function App() {
  const [backendStatus, setBackendStatus] = useState<string>("Checking...");
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(
    new Set()
  );
  const [dragPosition, setDragPosition] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [dragRotation, setDragRotation] = useState<{
    id: string;
    rotation: number;
  } | null>(null);
  const [dragScale, setDragScale] = useState<{
    id: string;
    scale: number;
  } | null>(null);
  const [groupDragDelta, setGroupDragDelta] = useState<{
    dx: number;
    dy: number;
  } | null>(null);
  const [groupRotateDelta, setGroupRotateDelta] = useState<number | null>(null);
  const [groupScaleDelta, setGroupScaleDelta] = useState<number | null>(null);
  const placedUnitsRef = useRef<Unit[]>([]);
  const selectedUnitIdsRef = useRef<Set<string>>(new Set());
  const {
    present: placedUnits,
    set: setPlacedUnits,
    undo,
    redo,
  } = useHistory<Unit[]>([]);
  const { refetch: refetchUnits } = useAssetList("units");
  const { saveProject, loadProject } = useProject("default");
  placedUnitsRef.current = placedUnits;
  selectedUnitIdsRef.current = selectedUnitIds;

  // useEffect for checking health of backend system.
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`)
      .then((response) => response.json())
      .then((data) => setBackendStatus(data.message))
      .catch(() => setBackendStatus("Could not reach backend"));
  }, []);

  // useEffect for deleting units. Also handles undo, redo.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedUnitIds.size > 0) {
          setPlacedUnits(
            placedUnits.filter((unit) => !selectedUnitIds.has(unit.id))
          );
          setSelectedUnitIds(new Set());
        }
      }
      if (e.metaKey && e.shiftKey && e.key === "z") {
        e.preventDefault();
        redo();
      } else if (e.metaKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUnitIds, placedUnits, undo, redo, setPlacedUnits]);

  // useEffect for placing units from a loaded project.
  useEffect(() => {
    loadProject().then((units) => {
      if (units.length > 0) {
        setPlacedUnits(units);
      }
    });
  }, [loadProject, setPlacedUnits]);

  // useEffect for saving unit locations to project.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s" && e.metaKey) {
        e.preventDefault();
        saveProject(placedUnits);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [placedUnits, saveProject]);

  const handleUploadComplete = (filename: string, type: AssetType) => {
    if (type === "units" || type === "portraits") {
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
    setDragPosition({ id, x, y });
  };

  const handleUnitMove = (id: string, x: number, y: number) => {
    setDragPosition(null);
    setPlacedUnits(
      placedUnits.map((unit) => (unit.id === id ? { ...unit, x, y } : unit))
    );
  };

  const handleUnitSelect = (
    id: string | null,
    addToSelection: boolean = false
  ) => {
    if (id === null) {
      setSelectedUnitIds(new Set());
      return;
    }
    if (addToSelection) {
      setSelectedUnitIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      setSelectedUnitIds(new Set([id]));
    }
  };

  const handleUnitRotate = (id: string, rotation: number) => {
    setDragRotation({ id, rotation });
  };

  const handleUnitRotateCommit = (id: string, rotation: number) => {
    setDragRotation(null);
    setPlacedUnits(
      placedUnits.map((unit) => (unit.id === id ? { ...unit, rotation } : unit))
    );
  };

  const handleUnitScale = (id: string, scale: number) => {
    setDragScale({ id, scale });
  };

  const handleUnitScaleCommit = (id: string, scale: number) => {
    setDragScale(null);
    setPlacedUnits(
      placedUnits.map((unit) => (unit.id === id ? { ...unit, scale } : unit))
    );
  };

  const handleBoxSelect = (ids: string[]) => {
    setSelectedUnitIds(new Set(ids));
  };

  const handleGroupDrag = (dx: number, dy: number) => {
    setGroupDragDelta({ dx, dy });
  };

  const handleGroupMove = (dx: number, dy: number) => {
    setGroupDragDelta(null);
    setPlacedUnits(
      placedUnitsRef.current.map((unit) =>
        selectedUnitIdsRef.current.has(unit.id)
          ? { ...unit, x: unit.x + dx, y: unit.y + dy }
          : unit
      )
    );
  };

  const handleGroupRotate = (delta: number) => {
    setGroupRotateDelta(delta);
  };

  const handleGroupRotateCommit = (delta: number) => {
    setGroupRotateDelta(null);
    setPlacedUnits(
      placedUnitsRef.current.map((unit) =>
        selectedUnitIdsRef.current.has(unit.id)
          ? { ...unit, rotation: unit.rotation + delta }
          : unit
      )
    );
  };

  const handleGroupScale = (delta: number) => {
    setGroupScaleDelta(delta);
  };

  const handleGroupScaleCommit = (delta: number) => {
    setGroupScaleDelta(null);
    setPlacedUnits(
      placedUnitsRef.current.map((unit) =>
        selectedUnitIdsRef.current.has(unit.id)
          ? { ...unit, scale: Math.min(Math.max(unit.scale + delta, 0.1), 5) }
          : unit
      )
    );
  };

  const displayUnits = placedUnits.map((unit) => {
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
    if (groupDragDelta && selectedUnitIds.has(unit.id)) {
      display.x = unit.x + groupDragDelta.dx;
      display.y = unit.y + groupDragDelta.dy;
    }
    if (groupRotateDelta !== null && selectedUnitIds.has(unit.id)) {
      display.rotation = unit.rotation + groupRotateDelta;
    }
    if (groupScaleDelta !== null && selectedUnitIds.has(unit.id)) {
      display.scale = Math.min(Math.max(unit.scale + groupScaleDelta, 0.1), 5);
    }
    return display;
  });

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "8px", flexShrink: 0 }}>
        <h1>HistoryMapTool</h1>
        <p>Backend status: {backendStatus}</p>
        <AssetImporter onUploadComplete={handleUploadComplete} />
      </div>
      <div style={{ position: "relative", flex: 1 }}>
        <MapCanvas
          placedUnits={displayUnits}
          onUnitDrag={handleUnitDrag}
          onUnitMove={handleUnitMove}
          onUnitRotate={handleUnitRotate}
          onUnitRotateCommit={handleUnitRotateCommit}
          onUnitScale={handleUnitScale}
          onUnitScaleCommit={handleUnitScaleCommit}
          onUnitSelect={handleUnitSelect}
          onBoxSelect={handleBoxSelect}
          onGroupDrag={handleGroupDrag}
          onGroupMove={handleGroupMove}
          onGroupRotate={handleGroupRotate}
          onGroupRotateCommit={handleGroupRotateCommit}
          onGroupScale={handleGroupScale}
          onGroupScaleCommit={handleGroupScaleCommit}
          selectedUnitIds={selectedUnitIds}
        />
      </div>
    </div>
  );
}

export default App;
