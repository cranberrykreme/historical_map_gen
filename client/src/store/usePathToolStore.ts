import { create } from "zustand";
import { PathPoint } from "../types";
import { useMapStore } from "./useMapStore";

interface WaypointRef {
  pathId: string;
  index: number;
}

interface DraftPath {
  id: string;
  points: PathPoint[];
}

// Temporary state for drawing and editing paths. It is not part of the document or
// its undo history: changes only enter the map store (and history) when they are finished.
interface PathToolStore {
  // Drawing a new path (null when not drawing)
  drawingPoints: PathPoint[] | null;
  startDrawing: () => void;
  addDrawingPoint: (point: PathPoint) => void;
  removeLastDrawingPoint: () => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;

  // Editing an existing path
  selectedWaypoint: WaypointRef | null;
  draftPath: DraftPath | null; // a path mid-drag, shown before it is committed
  selectWaypoint: (pathId: string, index: number) => void;
  clearWaypoint: () => void;
  setDraftPath: (draft: DraftPath | null) => void;
  commitDraftPath: () => void;
  insertWaypoint: (
    pathId: string,
    segmentIndex: number,
    point: PathPoint
  ) => void;
  deleteSelectedWaypoint: () => boolean;
  // Playback preview (display only: it never touches the document or its history)
  preview: { pathId: string; progress: number } | null;
  setPreview: (pathId: string, progress: number) => void;
  clearPreview: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
}

const DUPLICATE_DISTANCE = 0.5; // map units; a repeated click on the same spot is ignored

export const usePathToolStore = create<PathToolStore>((set, get) => ({
  drawingPoints: null,
  selectedWaypoint: null,
  draftPath: null,
  preview: null,
  playbackSpeed: 1,

  startDrawing: () => {
    useMapStore.getState().selectPath(null);
    useMapStore.getState().selectUnit(null);
    set({
      drawingPoints: [],
      selectedWaypoint: null,
      draftPath: null,
      preview: null,
    });
  },

  addDrawingPoint: (point) => {
    const { drawingPoints } = get();
    if (!drawingPoints) return;
    const last = drawingPoints[drawingPoints.length - 1];
    if (
      last &&
      Math.hypot(point.x - last.x, point.y - last.y) < DUPLICATE_DISTANCE
    )
      return;
    set({ drawingPoints: [...drawingPoints, point] });
  },

  removeLastDrawingPoint: () => {
    const { drawingPoints } = get();
    if (drawingPoints) set({ drawingPoints: drawingPoints.slice(0, -1) });
  },

  finishDrawing: () => {
    const { drawingPoints } = get();
    if (!drawingPoints || drawingPoints.length < 2) return;
    useMapStore.getState().addPath(drawingPoints);
    set({ drawingPoints: null });
  },

  cancelDrawing: () => set({ drawingPoints: null }),

  setPreview: (pathId, progress) =>
    set({ preview: { pathId, progress: Math.min(Math.max(progress, 0), 1) } }),

  clearPreview: () => set({ preview: null }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  selectWaypoint: (pathId, index) => {
    set({ selectedWaypoint: { pathId, index } });
    useMapStore.getState().selectPath(pathId);
    useMapStore.getState().selectUnit(null);
  },

  clearWaypoint: () => set({ selectedWaypoint: null }),

  setDraftPath: (draft) => set({ draftPath: draft }),

  // A finished drag becomes one undo step
  commitDraftPath: () => {
    const { draftPath } = get();
    set({ draftPath: null });
    if (draftPath) {
      useMapStore.getState().updatePathPoints(draftPath.id, draftPath.points);
    }
  },

  insertWaypoint: (pathId, segmentIndex, point) => {
    const path = useMapStore.getState().paths.find((p) => p.id === pathId);
    if (!path) return;
    const points = [...path.points];
    points.splice(segmentIndex + 1, 0, point);
    useMapStore.getState().updatePathPoints(pathId, points);
    get().selectWaypoint(pathId, segmentIndex + 1);
  },

  // Returns whether a waypoint was removed. A path always keeps at least two.
  deleteSelectedWaypoint: () => {
    const { selectedWaypoint } = get();
    if (!selectedWaypoint) return false;
    const path = useMapStore
      .getState()
      .paths.find((p) => p.id === selectedWaypoint.pathId);
    if (
      !path ||
      path.points.length <= 2 ||
      selectedWaypoint.index >= path.points.length
    ) {
      return false;
    }
    // The start of a march is where its units stand, so it can't be removed
    if (selectedWaypoint.index === 0 && path.assignments.length > 0) {
      return false;
    }
    useMapStore.getState().updatePathPoints(
      path.id,
      path.points.filter((_, i) => i !== selectedWaypoint.index)
    );
    set({ selectedWaypoint: null });
    return true;
  },
}));

// A selected waypoint only makes sense while its path is the selected thing:
// clear it when another path or any unit gets selected
useMapStore.subscribe((state) => {
  const waypoint = usePathToolStore.getState().selectedWaypoint;
  if (
    waypoint &&
    (state.selectedPathId !== waypoint.pathId || state.selectedUnitIds.size > 0)
  ) {
    usePathToolStore.setState({ selectedWaypoint: null });
  }
});
