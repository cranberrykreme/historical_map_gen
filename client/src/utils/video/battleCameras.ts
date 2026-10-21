import {
  Battle,
  CameraView,
  MAP_SCENE,
  SceneContent,
  VideoFrame,
} from "../../types";
import { ArmyTracker, BattleCameras, frameAspect } from "./camera";
import { armyTracker } from "../marches/follow";
import { HistoryTime } from "../history/historyTime";
import { getTimeline, Timeline } from "../history/timeline";

// Where the camera opens in a battle: the whole battlefield, with a little room round it,
// fitted to the video's shape
export function battleOpening(
  battle: Pick<Battle, "width" | "height">,
  frame: VideoFrame
): CameraView {
  const aspect = frameAspect(frame);
  return {
    centerX: battle.width / 2,
    centerY: battle.height / 2,
    height: Math.max(battle.height, battle.width / aspect) * 1.05,
  };
}

// One battle as the video needs it: its units, where its marches take them, and where its
// armies are
export interface BattleScene {
  battle: Battle;
  units: SceneContent["units"];
  timeline: Timeline;
  tracker: ArmyTracker;
}

// Every battle ready for the video, by id, from every scene's content (the one being edited
// included, see allScenes). Battles with nothing placed yet are there too, empty.
export function battleScenes(
  battles: Battle[],
  scenes: Record<string, SceneContent>,
  storyStart: HistoryTime
): Record<string, BattleScene> {
  const out: Record<string, BattleScene> = {};
  for (const battle of battles) {
    if (battle.id === MAP_SCENE) continue;
    const content = scenes[battle.id] ?? { units: [], paths: [], armies: [] };
    const timeline = getTimeline(content.paths, content.units);
    out[battle.id] = {
      battle,
      units: content.units,
      timeline,
      tracker: armyTracker(timeline, content.units, content.armies, storyStart),
    };
  }
  return out;
}

// The battles' openings and army trackers in the shape the camera asks for
export function battleCameras(
  scenes: Record<string, BattleScene>,
  frame: VideoFrame
): BattleCameras {
  return {
    opening: (id) => {
      const scene = scenes[id];
      return scene ? battleOpening(scene.battle, frame) : null;
    },
    tracker: (id) => scenes[id]?.tracker,
  };
}
