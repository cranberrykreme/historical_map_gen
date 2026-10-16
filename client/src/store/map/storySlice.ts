import { StateCreator } from "zustand";
import { MAP_SCENE } from "../../types";
import { DEFAULT_STORY_START } from "../../utils/convertProject";
import { MapStore, StorySlice } from "./types";

export const createStorySlice: StateCreator<MapStore, [], [], StorySlice> = (
  set
) => ({
  // Initial state
  storyStart: DEFAULT_STORY_START,
  displayMode: "months",
  pacing: [],
  videoFrame: "landscape",
  savedViewport: null,
  selectedMapFilename: null,

  setStoryStart: (storyStart) => set({ storyStart }),

  setDisplayMode: (displayMode) => set({ displayMode }),

  setPacing: (pacing) => set({ pacing }),

  setVideoFrame: (videoFrame) => set({ videoFrame }),

  setSavedViewport: (savedViewport) => set({ savedViewport }),

  setSelectedMap: (filename) => set({ selectedMapFilename: filename }),

  // Clears the whole document and its undo history for a newly loaded project
  resetMapState: () =>
    set({
      past: [],
      future: [],
      clipboard: [],
      placedUnits: [],
      paths: [],
      armies: [],
      selectedArmyId: null,
      shots: [],
      selectedShotId: null,
      battles: [],
      activeSceneId: MAP_SCENE,
      sceneStash: {},
      storyStart: DEFAULT_STORY_START,
      displayMode: "months",
      pacing: [],
      videoFrame: "landscape",
      savedViewport: null,
      selectedUnitIds: new Set(),
      selectedPathId: null,
      dragPosition: null,
      dragRotation: null,
      dragScale: null,
      groupDragDelta: null,
      groupRotateDelta: null,
      groupScaleDelta: null,
      selectedMapFilename: null,
    }),
});
