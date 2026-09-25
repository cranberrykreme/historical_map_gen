import { useCallback } from "react";
import API_BASE_URL from "../config/api";
import { Unit, ProjectData } from "../types";

function useProject(projectName: string = "default") {
  const saveProject = useCallback(
    async (units: Unit[], selectedMapFilename: string | null) => {
      const projectData: ProjectData = {
        name: projectName,
        units,
        selectedMapFilename,
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

  const loadProject = useCallback(async (): Promise<{
    units: Unit[];
    selectedMapFilename: string | null;
  }> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/load/${projectName}`
      );
      if (!response.ok) return { units: [], selectedMapFilename: null };
      const data = await response.json();
      return {
        units: data.units || [],
        selectedMapFilename: data.selectedMapFilename ?? null,
      };
    } catch (error) {
      console.error("Failed to load project: ", error);
      return { units: [], selectedMapFilename: null };
    }
  }, [projectName]);

  return { saveProject, loadProject };
}

export default useProject;
