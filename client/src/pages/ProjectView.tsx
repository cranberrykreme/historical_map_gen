import React, { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import MapCanvas from "../components/map/MapCanvas";
import Toolbar from "../components/toolbar/Toolbar";
import AssetTypePopup from "../components/project/AssetTypePopup";
import DropZoneOverlay from "../components/map/DropZoneOverlay";
import PsdEditor from "../components/psd-editor/PsdEditor";
import PortraitEditor from "../components/portrait-editor/PortraitEditor";
import ProjectHeader from "../components/project/ProjectHeader";
import Timeline from "../components/timeline/Timeline";
import DateDisplay from "../components/map/DateDisplay";
import { AssetType, ViewportApi } from "../types";
import { useMapStore } from "../store/useMapStore";
import { useAssetStore } from "../store/useAssetStore";
import { usePathToolStore } from "../store/usePathToolStore";
import useHistory from "../hooks/useHistory";
import useProjectShortcuts from "../hooks/useProjectShortcuts";
import useProject from "../hooks/useProject";
import useOpenProject from "../hooks/useOpenProject";
import useSaveProject from "../hooks/useSaveProject";
import useAssetUploads from "../hooks/useAssetUploads";
import styles from "../App.module.css";

function ProjectView() {
  const { projectName } = useParams<{ projectName: string }>();
  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const viewportApiRef = useRef<ViewportApi | null>(null);

  const { undo } = useHistory();
  const { saveProject, loadProject } = useProject(projectName ?? "default");
  const selectedMapFilename = useMapStore((state) => state.selectedMapFilename);
  const setSelectedMap = useMapStore((state) => state.setSelectedMap);
  const cleanupDeletedAsset = useMapStore((state) => state.cleanupDeletedAsset);
  const cleanupRenamedAsset = useMapStore((state) => state.cleanupRenamedAsset);
  const canUndo = useMapStore((state) => state.past.length > 0);
  const isDrawingPath = usePathToolStore(
    (state) => state.drawingPoints !== null
  );
  const deleteAsset = useAssetStore((state) => state.deleteAsset);

  const [editingPsd, setEditingPsd] = useState<string | null>(null);
  const [portraitSource, setPortraitSource] = useState<string | null>(null);

  useOpenProject(projectName, loadProject, viewportApiRef);
  const { saveStatus, handleSave, autoSaveFromStore } = useSaveProject(
    saveProject,
    viewportApiRef
  );

  useProjectShortcuts({
    editingPsd,
    portraitSource,
    isDrawingPath,
    handleSave,
  });

  const {
    pendingFiles,
    handleFilesSelected,
    handleAddAsset,
    handleConfirm,
    handleCancel,
  } = useAssetUploads(projectName);

  // Renaming or deleting an asset reaches units in every scene, battles included
  const handleAssetRenamed = (
    oldPath: string,
    newPath: string,
    assetType: AssetType
  ) => {
    useMapStore
      .getState()
      .inEveryScene(() => cleanupRenamedAsset(oldPath, newPath, assetType));
    autoSaveFromStore();
  };

  const handleAssetDeleted = (path: string, assetType: AssetType) => {
    useMapStore
      .getState()
      .inEveryScene(() => cleanupDeletedAsset(path, assetType));
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
