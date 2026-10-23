import React, { useEffect, useRef } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import {
  formatHistoryTime,
  HistoryTime,
} from "../../utils/history/historyTime";
import { allowedStoryStart } from "../../utils/history/historyEdit";
import { HistoryDisplay, VideoFrame } from "../../types";
import { MomentInput } from "./fields";
import styles from "./Timeline.module.css";

const FRAMES: { frame: VideoFrame; label: string; hint: string }[] = [
  {
    frame: "landscape",
    label: "16:9",
    hint: "Landscape video (1920×1080), for YouTube",
  },
  {
    frame: "portrait",
    label: "9:16",
    hint: "Portrait video (1080×1920), for shorts",
  },
];

const DISPLAYS: { mode: HistoryDisplay; label: string; hint: string }[] = [
  { mode: "months", label: "Months", hint: "The month and year" },
  { mode: "days", label: "Days", hint: "The day, month and year" },
  { mode: "times", label: "Times", hint: "The day and the time of day" },
];

// The video's settings, saved with the project: its shape, how the date shows on screen, and
// when the story starts (no later than the first march). Opened from ⚙ on the control bar;
// clicking outside it or pressing Escape closes it.
function VideoSettings({
  firstMarch,
  onClose,
}: {
  firstMarch: HistoryTime | null;
  onClose: () => void;
}) {
  const videoFrame = useMapStore((state) => state.videoFrame);
  const setVideoFrame = useMapStore((state) => state.setVideoFrame);
  const displayMode = useMapStore((state) => state.displayMode);
  const setDisplayMode = useMapStore((state) => state.setDisplayMode);
  const storyStart = useMapStore((state) => state.storyStart);
  const setStoryStart = useMapStore((state) => state.setStoryStart);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault(); // so the side panel stays open
      onClose();
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const commitStart = (wanted: HistoryTime) => {
    const next = allowedStoryStart(wanted, firstMarch);
    setStoryStart(next);
    // A playhead at or before the new start is at the start
    const timeline = useTimelineStore.getState();
    if (timeline.now !== null && timeline.now <= next) timeline.setNow(null);
  };

  return (
    <div className={styles.settingsPopup} ref={ref}>
      <div className={styles.settingsTitle}>Video settings</div>

      <div className={styles.settingsRow}>
        <span className={styles.settingsLabel}>Shape</span>
        <div className={styles.speed}>
          {FRAMES.map(({ frame, label, hint }) => (
            <button
              key={frame}
              title={hint}
              className={`${styles.speedButton} ${videoFrame === frame ? styles.speedActive : ""}`}
              onClick={() => setVideoFrame(frame)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.settingsRow}>
        <span className={styles.settingsLabel}>Date shows</span>
        <div className={styles.speed}>
          {DISPLAYS.map(({ mode, label, hint }) => (
            <button
              key={mode}
              title={hint}
              className={`${styles.speedButton} ${displayMode === mode ? styles.speedActive : ""}`}
              onClick={() => setDisplayMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.settingsRow}>
        <MomentInput
          label="Story starts"
          value={storyStart}
          onCommit={commitStart}
        />
      </div>
      <div className={styles.settingsHint}>
        {firstMarch !== null
          ? `No later than the first march (${formatHistoryTime(firstMarch, "times")})`
          : "Units appear at this moment, before any march"}
      </div>
    </div>
  );
}

export default VideoSettings;
