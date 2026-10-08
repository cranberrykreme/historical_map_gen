import { StateCreator } from "zustand";
import { DEFAULT_STORY_START } from "../../utils/convertProject";
import { MapStore, StorySlice } from "./types";

export const createStorySlice: StateCreator<MapStore, [], [], StorySlice> = (
  set
) => ({
  // Initial state
  storyStart: DEFAULT_STORY_START,
  displayMode: "months",
  pacing: [],
  selectedMapFilename: null,

  setStoryStart: (storyStart) => set({ storyStart }),

  setDisplayMode: (displayMode) => set({ displayMode }),

  setPacing: (pacing) => set({ pacing }),

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
      storyStart: DEFAULT_STORY_START,
      displayMode: "months",
      pacing: [],
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
