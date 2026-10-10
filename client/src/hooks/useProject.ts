import { useCallback } from "react";
import API_BASE_URL from "../config/api";
import {
  Army,
  HistoryDisplay,
  MapPath,
  PacingKey,
  PROJECT_VERSION,
  ProjectData,
  SavedViewport,
  Shot,
  Unit,
} from "../types";
import {
  emptyProject,
  LoadedProject,
  parseProject,
} from "../utils/convertProject";
import { HistoryTime } from "../utils/historyTime";

export interface ProjectSnapshot {
  units: Unit[];
  paths: MapPath[];
  armies: Army[];
  storyStart: HistoryTime;
  displayMode: HistoryDisplay;
  pacing: PacingKey[];
  shots: Shot[];
  selectedMapFilename: string | null;
  // Left out (undefined) for auto-saves; Flask then keeps the last saved view
  viewport?: SavedViewport | null;
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
        selectedMapFilename: snapshot.selectedMapFilename,
        viewport: snapshot.viewport,
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
