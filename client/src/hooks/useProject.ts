import { useCallback } from "react";
import API_BASE_URL from "../config/api";
import { Unit, ProjectData, SavedViewport } from "../types";

interface LoadedProject {
  units: Unit[];
  selectedMapFilename: string | null;
  viewport: SavedViewport | null;
}

function useProject(projectName: string = "default") {
  const saveProject = useCallback(
    async (
      units: Unit[],
      selectedMapFilename: string | null,
      viewport?: SavedViewport | null
    ) => {
      const projectData: ProjectData = {
        name: projectName,
        units,
        selectedMapFilename,
        viewport,
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/projects/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectData),
        });
        const data = await response.json();

        if (data.success) {
          console.log("Project saved successfully");
        }
      } catch (error) {
        console.error("Failed to save project: ", error);
      }
    },
    [projectName]
  );

  const loadProject = useCallback(async (): Promise<LoadedProject> => {
    const empty: LoadedProject = {
      units: [],
      selectedMapFilename: null,
      viewport: null,
    };
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/load/${projectName}`
      );
      if (!response.ok) return empty;
      const data = await response.json();

      const raw = data.viewport;
      const viewport: SavedViewport | null =
        raw && [raw.centerX, raw.centerY, raw.scale].every(Number.isFinite)
          ? { centerX: raw.centerX, centerY: raw.centerY, scale: raw.scale }
          : null;

      return {
        units: data.units || [],
        selectedMapFilename: data.selectedMapFilename ?? null,
        viewport,
      };
    } catch (error) {
      console.error("Failed to load project: ", error);
      return empty;
    }
  }, [projectName]);

  return { saveProject, loadProject };
}

export default useProject;
