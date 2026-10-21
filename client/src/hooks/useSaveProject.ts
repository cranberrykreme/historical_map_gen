import React, { useCallback, useState } from "react";
import { ViewportApi } from "../types";
import { useMapStore } from "../store/useMapStore";
import { SaveStatus } from "../components/project/ProjectHeader";
import useProject, { projectSnapshot } from "./useProject";
import { isMainMap } from "../utils/scenes/kinds";

// Saving the project: the save that ⌘S and the Save button share, with its status for the
// header, and the quiet save made after files change on disk
function useSaveProject(
  saveProject: ReturnType<typeof useProject>["saveProject"],
  viewportApiRef: React.RefObject<ViewportApi | null>
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // One save for both ⌘S and the Save button. It reads the store directly, so it always
  // saves what is there right now.
  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    const state = useMapStore.getState();
    // The saved view is the main map's, so saving while a battle is open keeps the last one
    const viewport = isMainMap(state.activeSceneId)
      ? viewportApiRef.current?.get()
      : undefined;
    const saved = await saveProject(projectSnapshot(viewport));
    // The video's camera opens on the view just saved
    if (saved && viewport) state.setSavedViewport(viewport);
    setSaveStatus(saved ? "saved" : "failed");
    window.setTimeout(() => setSaveStatus("idle"), 1500);
  }, [saveProject, viewportApiRef]);

  // Rename and delete change files on disk, so they auto-save the project.
  // The viewport is left out on purpose: Flask keeps the last saved view.
  const autoSaveFromStore = () => {
    saveProject(projectSnapshot());
  };

  return { saveStatus, handleSave, autoSaveFromStore };
}

export default useSaveProject;
