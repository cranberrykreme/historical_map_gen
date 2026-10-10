import { create } from "zustand";
import { syncChainedStarts } from "../utils/timeline";
import { syncArmyMarches } from "../utils/armies";
import { MapStore } from "./map/types";
import { createHistorySlice } from "./map/history";
import { createSelectionSlice } from "./map/selectionSlice";
import { createUnitsSlice } from "./map/unitsSlice";
import { createPathsSlice } from "./map/pathsSlice";
import { createArmiesSlice } from "./map/armiesSlice";
import { createShotsSlice } from "./map/shotsSlice";
import { createStorySlice } from "./map/storySlice";

// The map document store. Each slice in store/map/ owns one part of it; they all share
// one set/get, so any action can read and write the whole document.
export const useMapStore = create<MapStore>((...a) => ({
  ...createHistorySlice(...a),
  ...createSelectionSlice(...a),
  ...createUnitsSlice(...a),
  ...createPathsSlice(...a),
  ...createArmiesSlice(...a),
  ...createShotsSlice(...a),
  ...createStorySlice(...a),
}));

// Keeps the marches consistent with the rest of the document, whatever changed: units joining
// or leaving armies, reshaping or re-dating a march, moving units, undoing, loading a project.
// - Every army march is made up of whoever is in its army when it sets off.
// - Every chained march's start point is where its units arrive.
// Both are derived from the document, so they add no undo steps of their own.
useMapStore.subscribe((state, previous) => {
  if (
    state.paths === previous.paths &&
    state.placedUnits === previous.placedUnits &&
    state.armies === previous.armies
  ) {
    return;
  }
  const withMembers = syncArmyMarches(
    state.paths,
    state.armies,
    state.placedUnits
  );
  const synced = syncChainedStarts(withMembers, state.placedUnits);
  if (synced !== state.paths) useMapStore.setState({ paths: synced });
});

// Development only: lets you poke at the store from the browser console,
// e.g. mapStore.getState().paths
if (process.env.NODE_ENV === "development") {
  (window as unknown as { mapStore?: typeof useMapStore }).mapStore =
    useMapStore;
}
