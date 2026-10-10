import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MapCanvas from "../components/MapCanvas";
import Toolbar from "../components/toolbar/Toolbar";
import AssetTypePopup from "../components/AssetTypePopup";
import DropZoneOverlay from "../components/DropZoneOverlay";
import PsdEditor from "../components/psd-editor/PsdEditor";
import PortraitEditor from "../components/portrait-editor/PortraitEditor";
import ProjectHeader, { SaveStatus } from "../components/ProjectHeader";
import Timeline from "../components/Timeline";
import DateDisplay from "../components/DateDisplay";
import { AssetType, ViewportApi } from "../types";
import { useMapStore } from "../store/useMapStore";
import { useAssetStore } from "../store/useAssetStore";
import { usePathToolStore } from "../store/usePathToolStore";
import { useTimelineStore } from "../store/useTimelineStore";
import useHistory from "../hooks/useHistory";
import useProjectShortcuts from "../hooks/useProjectShortcuts";
import useProject from "../hooks/useProject";
import API_BASE_URL from "../config/api";
import styles from "../App.module.css";

function ProjectView() {
  const { projectName } = useParams<{ projectName: string }>();
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const setCurrentProject = useAssetStore((state) => state.setCurrentProject);
  const navigate = useNavigate();
  const viewportApiRef = useRef<ViewportApi | null>(null);

  const { undo } = useHistory();
  const { saveProject, loadProject } = useProject(projectName ?? "default");
  const setPlacedUnits = useMapStore((state) => state.setPlacedUnits);
  const setPaths = useMapStore((state) => state.setPaths);
  const setArmies = useMapStore((state) => state.setArmies);
  const setStoryStart = useMapStore((state) => state.setStoryStart);
  const setDisplayMode = useMapStore((state) => state.setDisplayMode);
  const setPacing = useMapStore((state) => state.setPacing);
  const setShots = useMapStore((state) => state.setShots);
  const selectedMapFilename = useMapStore((state) => state.selectedMapFilename);
  const setSelectedMap = useMapStore((state) => state.setSelectedMap);
  const cleanupDeletedAsset = useMapStore((state) => state.cleanupDeletedAsset);
  const cleanupRenamedAsset = useMapStore((state) => state.cleanupRenamedAsset);
  const resetMapState = useMapStore((state) => state.resetMapState);
  const canUndo = useMapStore((state) => state.past.length > 0);
  const isDrawingPath = usePathToolStore(
    (state) => state.drawingPoints !== null
  );

  const fetchAssetList = useAssetStore((state) => state.fetchAssetList);
  const deleteAsset = useAssetStore((state) => state.deleteAsset);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [editingPsd, setEditingPsd] = useState<string | null>(null);
  const [portraitSource, setPortraitSource] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    if (!projectName) {
      navigate("/");
      return;
    }
    resetMapState();
    useTimelineStore.getState().reset();
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
        armies,
        storyStart,
        displayMode,
        pacing,
        shots,
        selectedMapFilename: loadedMap,
        viewport,
      }) => {
        setStoryStart(storyStart);
        setDisplayMode(displayMode);
        setPacing(pacing);
        setShots(shots);
        if (units.length > 0) {
          setPlacedUnits(units);
        }
        if (loadedPaths.length > 0) {
          setPaths(loadedPaths);
        }
        setArmies(armies);
        if (loadedMap) {
          setSelectedMap(loadedMap);
        }
        if (viewport) {
          viewportApiRef.current?.apply(viewport);
        }
      }
    );
  }, [
    loadProject,
    setPlacedUnits,
    setPaths,
    setArmies,
    setStoryStart,
    setDisplayMode,
    setPacing,
    setShots,
    setSelectedMap,
  ]);

  // One save for both ⌘S and the Save button. It reads the store directly, so it always
  // saves what is there right now.
  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    const state = useMapStore.getState();
    const saved = await saveProject({
      units: state.placedUnits,
      paths: state.paths,
      armies: state.armies,
      storyStart: state.storyStart,
      displayMode: state.displayMode,
      pacing: state.pacing,
      shots: state.shots,
      selectedMapFilename: state.selectedMapFilename,
      viewport: viewportApiRef.current?.get(),
    });
    setSaveStatus(saved ? "saved" : "failed");
    window.setTimeout(() => setSaveStatus("idle"), 1500);
  }, [saveProject]);

  useProjectShortcuts({
    editingPsd,
    portraitSource,
    isDrawingPath,
    handleSave,
  });

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
      armies: state.armies,
      storyStart: state.storyStart,
      displayMode: state.displayMode,
      pacing: state.pacing,
      shots: state.shots,
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

  // The map is only shown once the stores belong to this project. Before that they still
  // hold the previous project's name and map, and the map would fetch the wrong file.
  const storesReady = currentProjectName === projectName;

  return (
    <div className={styles.app}>
      <ProjectHeader
        projectName={projectName}
        onSave={handleSave}
        onUndo={undo}
        canUndo={canUndo && !isDrawingPath}
        saveStatus={saveStatus}
      />
      {storesReady && (
        <MapCanvas key={projectName} viewportApiRef={viewportApiRef} />
      )}
      {storesReady && <Timeline />}
      {storesReady && <DateDisplay />}
      <Toolbar
        onAddAsset={handleAddAsset}
        selectedMapFilename={selectedMapFilename}
        onSelectMap={setSelectedMap}
        onDeleteAsset={(path, assetType) =>
          deleteAsset(path, assetType, handleAssetDeleted)
        }
        onAssetRenamed={handleAssetRenamed}
        onSelectPsd={setEditingPsd}
        onSelectPortraitSource={setPortraitSource}
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
      {portraitSource && (
        <PortraitEditor
          sourceName={portraitSource}
          onClose={() => setPortraitSource(null)}
        />
      )}
    </div>
  );
}

export default ProjectView;
