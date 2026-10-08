import React from "react";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import styles from "./PathsPanel.module.css";

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

// Its own component, so the panel doesn't re-render on every frame of playback
function PlaybackSlider({
  pathId,
  onScrub,
}: {
  pathId: string;
  onScrub: () => void;
}) {
  const progress = usePathToolStore((state) =>
    state.preview && state.preview.pathId === pathId
      ? state.preview.progress
      : 0
  );
  const setPreview = usePathToolStore((state) => state.setPreview);
  return (
    <input
      type="range"
      min={0}
      max={1000}
      step={1}
      value={Math.round(progress * 1000)}
      onChange={(e) => {
        onScrub();
        setPreview(pathId, Number(e.target.value) / 1000);
      }}
      onPointerUp={(e) => e.currentTarget.blur()}
      className={styles.slider}
    />
  );
}

// Play, reset, speed and a slider for previewing one path's march on its own. The play loop
// itself runs in PathsPanel, which owns `isPlaying`.
function PathPreview({
  pathId,
  isPlaying,
  setIsPlaying,
}: {
  pathId: string;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const clearPreview = usePathToolStore((state) => state.clearPreview);
  const playbackSpeed = usePathToolStore((state) => state.playbackSpeed);
  const setPlaybackSpeed = usePathToolStore((state) => state.setPlaybackSpeed);

  return (
    <div className={styles.preview}>
      <div className={styles.actions}>
        <button
          className={styles.finishButton}
          onClick={() => {
            useTimelineStore.getState().pause();
            setIsPlaying((playing) => !playing);
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          className={styles.cancelButton}
          onClick={() => {
            setIsPlaying(false);
            clearPreview();
          }}
        >
          Reset
        </button>
      </div>
      <div className={styles.segment}>
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            title={`${speed}x speed`}
            className={`${styles.segmentButton} ${
              playbackSpeed === speed ? styles.segmentActive : ""
            }`}
            onClick={() => setPlaybackSpeed(speed)}
          >
            {speed}×
          </button>
        ))}
      </div>
      <PlaybackSlider
        pathId={pathId}
        onScrub={() => {
          setIsPlaying(false);
          useTimelineStore.getState().pause();
        }}
      />
      <p className={styles.hint}>
        Preview only: your units go back to their real positions when you move
        the mouse off the toolbar.
      </p>
    </div>
  );
}

export default PathPreview;
