import { useCallback } from "react";
import API_BASE_URL from "../config/api";
import {
  DateMarker,
  DateMode,
  MapPath,
  ProjectData,
  SavedViewport,
  Unit,
} from "../types";
import { clampDate } from "../utils/dates";

export interface ProjectSnapshot {
  units: Unit[];
  paths: MapPath[];
  dateMarkers: DateMarker[];
  dateMode: DateMode;
  selectedMapFilename: string | null;
  // Left out (undefined) for auto-saves; Flask then keeps the last saved view
  viewport?: SavedViewport | null;
}

interface LoadedProject {
  units: Unit[];
  paths: MapPath[];
  dateMarkers: DateMarker[];
  dateMode: DateMode;
  selectedMapFilename: string | null;
  viewport: SavedViewport | null;
}

function useProject(projectName: string = "default") {
  const saveProject = useCallback(
    async (snapshot: ProjectSnapshot): Promise<boolean> => {
      const projectData: ProjectData = {
        name: projectName,
        units: snapshot.units,
        paths: snapshot.paths,
        dateMarkers: snapshot.dateMarkers,
        dateMode: snapshot.dateMode,
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

  const loadProject = useCallback(async (): Promise<LoadedProject> => {
    const empty: LoadedProject = {
      units: [],
      paths: [],
      dateMarkers: [],
      dateMode: "months",
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
            start: typeof path.start === "number" ? path.start : undefined,
            end: typeof path.end === "number" ? path.end : undefined,
          }))
        : [];

      const dateMarkers: DateMarker[] = Array.isArray(data.dateMarkers)
        ? data.dateMarkers
            .filter(
              (m: DateMarker) =>
                m &&
                typeof m.id === "string" &&
                [m.time, m.year, m.month, m.day].every(Number.isFinite)
            )
            .map((m: DateMarker) => ({
              id: m.id,
              time: Math.max(m.time, 0),
              ...clampDate(m),
            }))
        : [];

      return {
        units: data.units || [],
        paths,
        dateMarkers,
        dateMode: data.dateMode === "days" ? "days" : "months",
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
