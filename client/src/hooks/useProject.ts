import { useCallback } from "react";
import API_BASE_URL from "../config/api";
import {
  Army,
  HistoryDisplay,
  MapPath,
  PacingKey,
  MAP_SCENE,
  PROJECT_VERSION,
  ProjectData,
  SavedBattle,
  SavedViewport,
  Shot,
  Unit,
  VideoFrame,
} from "../types";
import {
  emptyProject,
  LoadedProject,
  parseProject,
} from "../utils/convertProject";
import { HistoryTime } from "../utils/historyTime";
import { emptyScene } from "../utils/scenes";
import { useMapStore } from "../store/useMapStore";

export interface ProjectSnapshot {
  units: Unit[];
  paths: MapPath[];
  armies: Army[];
  storyStart: HistoryTime;
  displayMode: HistoryDisplay;
  pacing: PacingKey[];
  shots: Shot[];
  videoFrame: VideoFrame;
  selectedMapFilename: string | null;
  // Left out (undefined) for auto-saves; Flask then keeps the last saved view
  viewport?: SavedViewport | null;
  battles: SavedBattle[];
}

// The project as it is in the store right now, ready to save: the main map's units, paths and
// armies, and each battle with its own, whichever scene happens to be open
export function projectSnapshot(
  viewport?: SavedViewport | null
): ProjectSnapshot {
  const state = useMapStore.getState();
  const scenes = state.sceneContents();
  const map = scenes[MAP_SCENE] ?? emptyScene();
  return {
    units: map.units,
    paths: map.paths,
    armies: map.armies,
    storyStart: state.storyStart,
    displayMode: state.displayMode,
    pacing: state.pacing,
    shots: state.shots,
    videoFrame: state.videoFrame,
    selectedMapFilename: state.selectedMapFilename,
    viewport,
    battles: state.battles.map((battle) => ({
      ...battle,
      ...(scenes[battle.id] ?? emptyScene()),
    })),
  };
}

function useProject(projectName: string = "default") {
  const saveProject = useCallback(
    async (snapshot: ProjectSnapshot): Promise<boolean> => {
      const projectData: ProjectData = {
        name: projectName,
        version: PROJECT_VERSION,
        units: snapshot.units,
        paths: snapshot.paths,
        armies: snapshot.armies,
        storyStart: snapshot.storyStart,
        displayMode: snapshot.displayMode,
        pacing: snapshot.pacing,
        shots: snapshot.shots,
        videoFrame: snapshot.videoFrame,
        selectedMapFilename: snapshot.selectedMapFilename,
        viewport: snapshot.viewport,
        battles: snapshot.battles,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/projects/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        });
        const data = await response.json();
        return !!data.success;
      } catch (error) {
        console.error("Failed to save project: ", error);
        return false;
      }
    },
    [projectName]
  );

  // Older project files are converted as they load (see parseProject). They are written
  // back in the new form the next time the project is saved.
  const loadProject = useCallback(async (): Promise<LoadedProject> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/load/${projectName}`
      );
      if (!response.ok) return emptyProject();
      return parseProject(await response.json());
    } catch (error) {
      console.error("Failed to load project: ", error);
      return emptyProject();
    }
  }, [projectName]);

  return { saveProject, loadProject };
}

export default useProject;
