import { create } from "zustand";
import { CameraView, SavedViewport } from "../types";
import type { FrameRect } from "../utils/camera";

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
  // Where the map's drawing sits, in map units, as the editor lays it out; null with no map
  mapBox: () => { x: number; y: number; width: number; height: number } | null;
  // Where the main map's drawing sits, even while a battle is open: where it was last
  // measured, or else laid out out of sight from the map's SVG text, when given
  mainMapBox: (svgText?: string) => {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

interface CameraStore {
  api: CameraApi | null;
  setApi: (api: CameraApi | null) => void;
  // Where the video frame is on the screen, in pixels from the window's top left corner, for
  // things drawn over the frame from outside the map (the date). Null before the map is laid out.
  frameOnScreen: FrameRect | null;
  setFrameOnScreen: (frame: FrameRect | null) => void;
}

export const useCameraStore = create<CameraStore>((set) => ({
  api: null,
  setApi: (api) => set({ api }),
  frameOnScreen: null,
  setFrameOnScreen: (frameOnScreen) => set({ frameOnScreen }),
}));
