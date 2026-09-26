import React, { useEffect, useState } from "react";
import MapCanvas from "./components/MapCanvas";
import Toolbar from "./components/toolbar/Toolbar";
import AssetTypePopup from "./components/AssetTypePopup";
import DropZoneOverlay from "./components/DropZoneOverlay";
import { AssetType } from "./types";
import { useMapStore } from "./store/useMapStore";
import useHistory from "./hooks/useHistory";
import useProject from "./hooks/useProject";
import API_BASE_URL from "./config/api";
import styles from "./App.module.css";
import { useAssetStore } from "./store/useAssetStore";

function App() {
  const { undo, redo } = useHistory();
  const { saveProject, loadProject } = useProject("default");
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const addUnit = useMapStore((state) => state.addUnit);
  const removeSelectedUnits = useMapStore((state) => state.removeSelectedUnits);
  const setPlacedUnits = useMapStore((state) => state.setPlacedUnits);
  const fetchAssetList = useAssetStore((state) => state.fetchAssetList);

  // copy/paste
  const copySelectedUnits = useMapStore((state) => state.copySelectedUnits);
  const pasteUnits = useMapStore((state) => state.pasteUnits);

  // Map selection
  const selectedMapFilename = useMapStore((state) => state.selectedMapFilename);
  const setSelectedMap = useMapStore((state) => state.setSelectedMap);

  // delete asset
  const deleteAsset = useAssetStore((state) => state.deleteAsset);
  const cleanupDeletedAsset = useMapStore((state) => state.cleanupDeletedAsset);

  // Load project on startup
  useEffect(() => {
    loadProject().then(({ units, selectedMapFilename }) => {
      if (units.length > 0) {
        setPlacedUnits(units);
      }
      if (selectedMapFilename) {
        setSelectedMap(selectedMapFilename);
      }
    });
  }, [loadProject, setPlacedUnits, setSelectedMap]);

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
        saveProject(placedUnits, selectedMapFilename);
      }
      // copy/paste
      if (e.metaKey && e.key === "c") {
        e.preventDefault();
        copySelectedUnits();
      }
      if (e.metaKey && e.key === "v") {
        e.preventDefault();
        pasteUnits();
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
    copySelectedUnits,
    pasteUnits,
  ]);
  // Called when user clicks + in toolbar or drops a file
  const handleFileSelected = (file: File) => {
    setPendingFile(file);
  };

  const handlePlaceUnit = (filename: string, assetType: AssetType) => {
    addUnit(filename, assetType);
  };

  // Called when user clicks + in toolbar — opens file browser
  const handleAddAsset = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".png,.jpg,.jpeg,.svg";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileSelected(file);
    };
    input.click();
  };

  // Called when user confirms asset type in popup
  const handleConfirm = async (file: File, type: AssetType) => {
    setPendingFile(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        fetchAssetList(type);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleCancel = () => {
    setPendingFile(null);
  };

  useEffect(() => {
    fetchAssetList("units");
    fetchAssetList("portraits");
    fetchAssetList("maps");
  }, [fetchAssetList]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  return (
    <div className={styles.app}>
      <MapCanvas />
      <Toolbar
        onAddAsset={handleAddAsset}
        onPlaceUnit={handlePlaceUnit}
        selectedMapFilename={selectedMapFilename}
        onSelectMap={setSelectedMap}
        onDeleteAsset={(filename, assetType) =>
          deleteAsset(filename, assetType, cleanupDeletedAsset)
        }
      />{" "}
      <DropZoneOverlay onFileDrop={handleFileSelected} />
      <AssetTypePopup
        file={pendingFile}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default App;
