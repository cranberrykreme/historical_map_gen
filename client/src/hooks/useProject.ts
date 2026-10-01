import { useCallback } from "react";
import API_BASE_URL from "../config/api";
import { Unit, MapPath, ProjectData, SavedViewport } from "../types";

export interface ProjectSnapshot {
  units: Unit[];
  paths: MapPath[];
  selectedMapFilename: string | null;
  // Left out (undefined) for auto-saves; Flask then keeps the last saved view
  viewport?: SavedViewport | null;
}

interface LoadedProject {
  units: Unit[];
  paths: MapPath[];
  selectedMapFilename: string | null;
  viewport: SavedViewport | null;
}

function useProject(projectName: string = "default") {
  const saveProject = useCallback(
    async (snapshot: ProjectSnapshot) => {
      const projectData: ProjectData = {
        name: projectName,
        units: snapshot.units,
        paths: snapshot.paths,
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
      paths: [],
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

      const paths: MapPath[] = Array.isArray(data.paths)
        ? data.paths.map((path: MapPath) => ({
            id: path.id,
            name: path.name,
            points: Array.isArray(path.points) ? path.points : [],
            assignments: Array.isArray(path.assignments)
              ? path.assignments
              : [],
            direction:
              typeof path.direction === "number" ? path.direction : undefined,
          }))
        : [];

      return {
        units: data.units || [],
        paths,
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
