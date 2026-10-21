import { useMemo } from "react";
import { useMapStore } from "../store/useMapStore";
import { MAP_SCENE } from "../types";
import { ArmyTracker, BattleCameras } from "../utils/video/camera";
import { battleCameras, battleScenes } from "../utils/video/battleCameras";
import { armyTracker } from "../utils/marches/follow";
import { allScenes } from "../utils/scenes/scenes";
import { getTimeline } from "../utils/history/timeline";

// Where the armies are in every scene, and where the camera opens in each battle, for the
// video's camera: the main map's army tracker (whichever scene is open in the editor) and the
// battles' openings and trackers. Rebuilt when anything placed, marched or grouped changes.
function useSceneCameras(): {
  tracker: ArmyTracker;
  battles: BattleCameras;
} {
  const battles = useMapStore((state) => state.battles);
  const sceneStash = useMapStore((state) => state.sceneStash);
  const activeSceneId = useMapStore((state) => state.activeSceneId);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const paths = useMapStore((state) => state.paths);
  const armies = useMapStore((state) => state.armies);
  const storyStart = useMapStore((state) => state.storyStart);
  const videoFrame = useMapStore((state) => state.videoFrame);
  return useMemo(() => {
    const scenes = allScenes({
      activeSceneId,
      sceneStash,
      placedUnits,
      paths,
      armies,
    });
    const main = scenes[MAP_SCENE] ?? { units: [], paths: [], armies: [] };
    const tracker = armyTracker(
      getTimeline(main.paths, main.units),
      main.units,
      main.armies,
      storyStart
    );
    const ready = battleScenes(battles, scenes, storyStart);
    return { tracker, battles: battleCameras(ready, videoFrame) };
  }, [
    battles,
    sceneStash,
    activeSceneId,
    placedUnits,
    paths,
    armies,
    storyStart,
    videoFrame,
  ]);
}

export default useSceneCameras;
