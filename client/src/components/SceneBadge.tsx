import React from "react";
import { useMapStore } from "../store/useMapStore";
import { useTimelineStore } from "../store/useTimelineStore";
import { useCameraStore } from "../store/useCameraStore";
import { MAP_SCENE } from "../types";
import styles from "./SceneBadge.module.css";

// How far right of the frame's corner the badge starts in video mode, past the frame's own
// "16:9 · 1920×1080" label
const PAST_FRAME_LABEL = 116;

// Says which battle is open, with a way back to the main map. It sits top left, clear of the
// header: just under the date in history mode, and beside the frame's size label, above the
// frame, in video mode. Nothing is shown on the main map itself.
function SceneBadge() {
  const battle = useMapStore(
    (state) => state.battles.find((b) => b.id === state.activeSceneId) ?? null
  );
  const switchScene = useMapStore((state) => state.switchScene);
  const inVideo = useTimelineStore((state) => state.mode === "video");
  const frame = useCameraStore((state) => state.frameOnScreen);
  if (!battle) return null;

  const onFrame = inVideo && frame !== null;
  return (
    <div
      className={`${styles.badge} ${onFrame ? styles.compact : styles.underDate}`}
      style={
        onFrame
          ? { left: frame.left + PAST_FRAME_LABEL, top: frame.top - 21 }
          : undefined
      }
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className={styles.icon}>⚔</span>
      <span className={styles.name} title={battle.name}>
        {battle.name}
      </span>
      <span className={styles.kind}>
        {battle.kind === "sea" ? "Sea battle" : "Land battle"}
      </span>
      <button
        className={styles.back}
        onClick={() => switchScene(MAP_SCENE)}
        title="Back to the main map"
      >
        ← Main map
      </button>
    </div>
  );
}

export default SceneBadge;
