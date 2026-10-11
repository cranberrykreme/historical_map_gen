import { create } from "zustand";
import { CameraView, SavedViewport } from "../types";

// How the rest of the app reads and moves the map's camera. The map registers it while it is
// on screen; it is null otherwise.
export interface CameraApi {
  // What the video frame shows right now, or null if the map isn't laid out yet
  viewNow: () => CameraView | null;
  // Moves the map so the video frame shows a view
  show: (view: CameraView) => void;
  // What the frame would show with the map placed at a saved view (the project's own view,
  // saved with ⌘S), or null if the map isn't laid out yet
  fromSaved: (viewport: SavedViewport) => CameraView | null;
}

interface CameraStore {
  api: CameraApi | null;
  setApi: (api: CameraApi | null) => void;
}

export const useCameraStore = create<CameraStore>((set) => ({
  api: null,
  setApi: (api) => set({ api }),
}));
