import { useMemo } from "react";
import { useMapStore } from "../store/useMapStore";
import { ArmyTracker } from "../utils/camera";
import { armyTracker } from "../utils/follow";
import { getTimeline } from "../utils/timeline";

// Where each army is at any moment, for cameras that follow one. Rebuilt when the units,
// marches or armies change.
function useArmyTracker(): ArmyTracker {
  const paths = useMapStore((state) => state.paths);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const armies = useMapStore((state) => state.armies);
  const storyStart = useMapStore((state) => state.storyStart);
  return useMemo(
    () =>
      armyTracker(
        getTimeline(paths, placedUnits),
        placedUnits,
        armies,
        storyStart
      ),
    [paths, placedUnits, armies, storyStart]
  );
}

export default useArmyTracker;
