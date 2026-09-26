import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MapCanvas from "../components/MapCanvas";
import Toolbar from "../components/toolbar/Toolbar";
import AssetTypePopup from "../components/AssetTypePopup";
import DropZoneOverlay from "../components/DropZoneOverlay";
import { AssetType } from "../types";
import { useMapStore } from "../store/useMapStore";
import { useAssetStore } from "../store/useAssetStore";
import useHistory from "../hooks/useHistory";
import useProject from "../hooks/useProject";
import API_BASE_URL from "../config/api";
import styles from "../App.module.css";

function ProjectView() {
  const { projectName } = useParams<{ projectName: string }>();
  const setCurrentProject = useAssetStore((state) => state.setCurrentProject);
  const navigate = useNavigate();

  const { undo, redo } = useHistory();
  const { saveProject, loadProject } = useProject(projectName ?? "default");
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const addUnit = useMapStore((state) => state.addUnit);
  const removeSelectedUnits = useMapStore((state) => state.removeSelectedUnits);
  const setPlacedUnits = useMapStore((state) => state.setPlacedUnits);
  const copySelectedUnits = useMapStore((state) => state.copySelectedUnits);
  const pasteUnits = useMapStore((state) => state.pasteUnits);
  const selectedMapFilename = useMapStore((state) => state.selectedMapFilename);
  const setSelectedMap = useMapStore((state) => state.setSelectedMap);
  const cleanupDeletedAsset = useMapStore((state) => state.cleanupDeletedAsset);

  const fetchAssetList = useAssetStore((state) => state.fetchAssetList);
  const deleteAsset = useAssetStore((state) => state.deleteAsset);

  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    if (!projectName) {
      navigate("/");
      return;
    }
    setCurrentProject(projectName);
    fetchAssetList("units");
    fetchAssetList("portraits");
    fetchAssetList("maps");
  }, [projectName, fetchAssetList, navigate, setCurrentProject]);

  useEffect(() => {
    loadProject().then(({ units, selectedMapFilename: loadedMap }) => {
      if (units.length > 0) {
        setPlacedUnits(units);
      }
      if (loadedMap) {
        setSelectedMap(loadedMap);
      }
    });
  }, [loadProject, setPlacedUnits, setSelectedMap]);

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
    selectedMapFilename,
    copySelectedUnits,
    pasteUnits,
  ]);

  const handleFileSelected = (file: File) => {
    setPendingFile(file);
  };

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

  const handleConfirm = async (file: File, type: AssetType) => {
    setPendingFile(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectName}/assets/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
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

  const handlePlaceUnit = (filename: string, assetType: AssetType) => {
    addUnit(filename, assetType);
  };

  if (!projectName) return null;

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
      />
      <DropZoneOverlay onFileDrop={handleFileSelected} />
      <AssetTypePopup
        file={pendingFile}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default ProjectView;
