import React, { useEffect } from "react";
import MapCanvas from "./components/MapCanvas";
import AssetImporter from "./components/AssetImporter";
import { AssetType } from "./types";
import { useMapStore } from "./store/useMapStore";
import useHistory from "./hooks/useHistory";
import useProject from "./hooks/useProject";
import useAssetList from "./hooks/useAssetList";

function App() {
  const { undo, redo } = useHistory();
  const { saveProject, loadProject } = useProject("default");
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const addUnit = useMapStore((state) => state.addUnit);
  const removeSelectedUnits = useMapStore((state) => state.removeSelectedUnits);
  const setPlacedUnits = useMapStore((state) => state.setPlacedUnits);
  const { refetch: refetchUnits } = useAssetList("units");

  // Load project on startup
  useEffect(() => {
    loadProject().then((units) => {
      if (units.length > 0) {
        setPlacedUnits(units);
      }
    });
  }, [loadProject, setPlacedUnits]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedUnitIds.size > 0) {
          removeSelectedUnits();
        }
      }
      if (e.metaKey && e.shiftKey && e.key === "z") {
        e.preventDefault();
        redo();
      } else if (e.metaKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if (e.metaKey && e.key === "s") {
        e.preventDefault();
        saveProject(placedUnits);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedUnitIds,
    placedUnits,
    undo,
    redo,
    removeSelectedUnits,
    saveProject,
  ]);

  const handleUploadComplete = (filename: string, type: AssetType) => {
    if (type === "units" || type === "portraits") {
      refetchUnits();
      addUnit(filename, type);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 9999 }}>
        <AssetImporter onUploadComplete={handleUploadComplete} />
      </div>
      <MapCanvas />
    </div>
  );
}

export default App;
