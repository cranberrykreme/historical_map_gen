import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MapCanvas from "../components/MapCanvas";
import Toolbar from "../components/toolbar/Toolbar";
import AssetTypePopup from "../components/AssetTypePopup";
import DropZoneOverlay from "../components/DropZoneOverlay";
import PsdEditor from "../components/psd-editor/PsdEditor";
import PortraitEditor from "../components/portrait-editor/PortraitEditor";
import { AssetType, ViewportApi } from "../types";
import { useMapStore } from "../store/useMapStore";
import { useAssetStore } from "../store/useAssetStore";
import useHistory from "../hooks/useHistory";
import useProject from "../hooks/useProject";
import API_BASE_URL from "../config/api";
import styles from "../App.module.css";
import ProjectHeader from "../components/ProjectHeader";
import { usePathToolStore } from "../store/usePathToolStore";

function ProjectView() {
  const { projectName } = useParams<{ projectName: string }>();
  const setCurrentProject = useAssetStore((state) => state.setCurrentProject);
  const navigate = useNavigate();
  const viewportApiRef = useRef<ViewportApi | null>(null);

  const { undo, redo } = useHistory();
  const { saveProject, loadProject } = useProject(projectName ?? "default");
  const placedUnits = useMapStore((state) => state.placedUnits);
  const paths = useMapStore((state) => state.paths);
  const isDrawingPath = usePathToolStore(
    (state) => state.drawingPoints !== null
  );
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const removeSelectedUnits = useMapStore((state) => state.removeSelectedUnits);
  const setPlacedUnits = useMapStore((state) => state.setPlacedUnits);
  const setPaths = useMapStore((state) => state.setPaths);
  const copySelectedUnits = useMapStore((state) => state.copySelectedUnits);
  const pasteUnits = useMapStore((state) => state.pasteUnits);
  const flipSelectedUnits = useMapStore((state) => state.flipSelectedUnits);
  const selectedMapFilename = useMapStore((state) => state.selectedMapFilename);
  const setSelectedMap = useMapStore((state) => state.setSelectedMap);
  const cleanupDeletedAsset = useMapStore((state) => state.cleanupDeletedAsset);
  const cleanupRenamedAsset = useMapStore((state) => state.cleanupRenamedAsset);
  const resetMapState = useMapStore((state) => state.resetMapState);

  const fetchAssetList = useAssetStore((state) => state.fetchAssetList);
  const deleteAsset = useAssetStore((state) => state.deleteAsset);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [editingPsd, setEditingPsd] = useState<string | null>(null);
  const [editingPortraitSource, setEditingPortraitSource] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!projectName) {
      navigate("/");
      return;
    }
    resetMapState();
    setCurrentProject(projectName);
    fetchAssetList("units");
    fetchAssetList("portraits");
    fetchAssetList("maps");
  }, [projectName, fetchAssetList, navigate, setCurrentProject, resetMapState]);

  useEffect(() => {
    loadProject().then(
      ({
        units,
        paths: loadedPaths,
        selectedMapFilename: loadedMap,
        viewport,
      }) => {
        if (units.length > 0) {
          setPlacedUnits(units);
        }
        if (loadedPaths.length > 0) {
          setPaths(loadedPaths);
        }
        if (loadedMap) {
          setSelectedMap(loadedMap);
        }
        if (viewport) {
          viewportApiRef.current?.apply(viewport);
        }
      }
    );
  }, [loadProject, setPlacedUnits, setPaths, setSelectedMap]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingPsd || editingPortraitSource || isDrawingPath) return;

      // Don't hijack keys while typing in a text field (rename, new folder, ...)
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Path editing: Escape deselects, Backspace/Delete removes the selected waypoint
      const pathTool = usePathToolStore.getState();
      if (e.key === "Escape") {
        // Only stop the browser's own Escape (leaving fullscreen) when it deselected something
        if (pathTool.selectedWaypoint) {
          e.preventDefault();
          pathTool.clearWaypoint();
        } else if (useMapStore.getState().selectedPathId) {
          e.preventDefault();
          useMapStore.getState().selectPath(null);
        }
        return;
      }
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        pathTool.selectedWaypoint
      ) {
        e.preventDefault();
        pathTool.deleteSelectedWaypoint();
        return;
      }

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
        saveProject({
          units: placedUnits,
          paths,
          selectedMapFilename,
          viewport: viewportApiRef.current?.get(),
        });
      }
      if (e.metaKey && e.key === "c") {
        e.preventDefault();
        copySelectedUnits();
      }
      if (e.metaKey && e.key === "v") {
        e.preventDefault();
        pasteUnits();
      }
      // M = mirror the selected units
      if (
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "m"
      ) {
        flipSelectedUnits();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    editingPsd,
    editingPortraitSource,
    selectedUnitIds,
    placedUnits,
    paths,
    undo,
    redo,
    removeSelectedUnits,
    saveProject,
    selectedMapFilename,
    copySelectedUnits,
    pasteUnits,
    flipSelectedUnits,
  ]);

  const handleFilesSelected = (files: File[]) => {
    setPendingFiles(files);
  };

  const handleAddAsset = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".png,.jpg,.jpeg,.svg";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFilesSelected(Array.from(files));
      }
    };
    input.click();
  };

  const handleConfirm = async (files: File[], type: AssetType) => {
    setPendingFiles([]);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      try {
        await fetch(
          `${API_BASE_URL}/api/projects/${projectName}/assets/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
      }
    }

    fetchAssetList(type);
  };

  const handleCancel = () => {
    setPendingFiles([]);
  };

  // Rename and delete change files on disk, so they auto-save the project.
  // The viewport is left out on purpose: Flask keeps the last saved view.
  const autoSaveFromStore = () => {
    const state = useMapStore.getState();
    saveProject({
      units: state.placedUnits,
      paths: state.paths,
      selectedMapFilename: state.selectedMapFilename,
    });
  };

  const handleAssetRenamed = (
    oldPath: string,
    newPath: string,
    assetType: AssetType
  ) => {
    cleanupRenamedAsset(oldPath, newPath, assetType);
    autoSaveFromStore();
  };

  const handleAssetDeleted = (path: string, assetType: AssetType) => {
    cleanupDeletedAsset(path, assetType);
    autoSaveFromStore();
  };

  if (!projectName) return null;

  return (
    <div className={styles.app}>
      <ProjectHeader projectName={projectName} />
      <MapCanvas key={projectName} viewportApiRef={viewportApiRef} />
      <Toolbar
        onAddAsset={handleAddAsset}
        selectedMapFilename={selectedMapFilename}
        onSelectMap={setSelectedMap}
        onDeleteAsset={(path, assetType) =>
          deleteAsset(path, assetType, handleAssetDeleted)
        }
        onAssetRenamed={handleAssetRenamed}
        onSelectPsd={setEditingPsd}
        onSelectPortraitSource={setEditingPortraitSource}
      />
      <DropZoneOverlay onFilesDrop={handleFilesSelected} />
      <AssetTypePopup
        files={pendingFiles}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      {editingPsd && (
        <PsdEditor psdName={editingPsd} onClose={() => setEditingPsd(null)} />
      )}
      {editingPortraitSource && (
        <PortraitEditor
          sourceName={editingPortraitSource}
          onClose={() => setEditingPortraitSource(null)}
        />
      )}
    </div>
  );
}

export default ProjectView;
