import React, { useState } from "react";
import FramePreview from "../render/FramePreview";
import VideoSettings from "./VideoSettings";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useSidePanelStore } from "../../store/useSidePanelStore";
import {
  isPastStart,
  TimelineMode,
  useTimelineStore,
} from "../../store/useTimelineStore";
import {
  formatHistoryTime,
  HistoryTime,
} from "../../utils/history/historyTime";
import { PACES, paceIndex } from "../../utils/history/paces";
import { formatSeconds, videoLength } from "../../utils/video/shots";
import styles from "./Timeline.module.css";

const MODES: { mode: TimelineMode; label: string; hint: string }[] = [
  {
    mode: "history",
    label: "History",
    hint: "Play and scrub through history at the chosen pace",
  },
  {
    mode: "video",
    label: "Video",
    hint: "Play the video: the shots in order, in real time, as the viewer will see them",
  },
];

// The timeline's control bar. Left: rewind, play and the date (and in Video mode the video's
// clock and Preview frame). Middle: History or Video. Right: the pace (History mode), Render,
// the video settings and the button that folds the timeline away.
function Transport({
  current,
  hasMarches,
  storyEnd,
  firstMarch,
}: {
  current: HistoryTime;
  hasMarches: boolean;
  storyEnd: HistoryTime | null;
  firstMarch: HistoryTime | null;
}) {
  const storyStart = useMapStore((state) => state.storyStart);
  const shots = useMapStore((state) => state.shots);

  const now = useTimelineStore((state) => state.now);
  const playing = useTimelineStore((state) => state.playing);
  const pace = useTimelineStore((state) => state.pace);
  const expanded = useTimelineStore((state) => state.expanded);
  const setNow = useTimelineStore((state) => state.setNow);
  const play = useTimelineStore((state) => state.play);
  const pause = useTimelineStore((state) => state.pause);
  const setPace = useTimelineStore((state) => state.setPace);
  const setExpanded = useTimelineStore((state) => state.setExpanded);
  const mode = useTimelineStore((state) => state.mode);
  const setMode = useTimelineStore((state) => state.setMode);
  const videoTime = useTimelineStore((state) => state.videoTime);
  const setVideoTime = useTimelineStore((state) => state.setVideoTime);

  const videoEnd = videoLength(shots);
  const inVideo = mode === "video";
  const [previewAt, setPreviewAt] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handlePlay = () => {
    if (playing) {
      pause();
      return;
    }
    usePathToolStore.getState().clearPreview(); // the timeline and a path preview never both play
    if (inVideo) {
      if (videoTime >= videoEnd - 1e-9) setVideoTime(0);
    } else if (storyEnd !== null && current >= storyEnd - 1e-9) {
      setNow(null);
    }
    play();
  };

  const handleRewind = () => {
    pause();
    if (inVideo) setVideoTime(0);
    else setNow(null);
  };

  return (
    <div className={styles.transport}>
      <div className={styles.transportSide}>
        <button
          className={styles.iconButton}
          onClick={handleRewind}
          title={
            inVideo
              ? "Back to the start of the video"
              : "Back to the start of the story (units can be edited there)"
          }
        >
          {"⏮︎"}
        </button>
        <button
          className={styles.playButton}
          onClick={handlePlay}
          disabled={inVideo ? videoEnd <= 0 : !hasMarches}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? "❚❚" : "▶︎"}
        </button>
        <span className={styles.time}>
          {formatHistoryTime(current, "times")}
        </span>
        {inVideo && (
          <span
            className={styles.videoClock}
            title="Video playhead / video length"
          >
            {formatSeconds(videoTime)} / {formatSeconds(videoEnd)}
          </span>
        )}
        {inVideo && (
          <button
            className={styles.textButton}
            onClick={() => {
              pause();
              setPreviewAt(useTimelineStore.getState().videoTime);
            }}
            title="Draw this moment exactly as the finished video will show it, at full size"
          >
            Preview frame
          </button>
        )}
        {!inVideo && isPastStart(now, storyStart) && !playing && (
          <span className={styles.note}>
            Units can only be moved at the moment they appear
          </span>
        )}
      </div>

      <div className={styles.speed} title="What the playhead follows">
        {MODES.map(({ mode: option, label, hint }) => (
          <button
            key={option}
            title={
              option === "video" && videoEnd <= 0 ? "Add a shot first" : hint
            }
            disabled={option === "video" && videoEnd <= 0}
            className={`${styles.speedButton} ${mode === option ? styles.speedActive : ""}`}
            onClick={() => setMode(option)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`${styles.transportSide} ${styles.transportRight}`}>
        {!inVideo && (
          <select
            className={styles.paceSelect}
            value={paceIndex(pace)}
            onChange={(e) => setPace(PACES[Number(e.target.value)].days)}
            title="How much history plays in each second"
          >
            {PACES.map(({ label }, index) => (
              <option key={label} value={index}>
                {label} / sec
              </option>
            ))}
          </select>
        )}
        <button
          className={styles.textButton}
          disabled={shots.length === 0}
          onClick={() => {
            pause();
            useSidePanelStore.getState().open("publish");
          }}
          title={
            shots.length === 0
              ? "Add shots first: the video is made of them"
              : "Open Publish, to render the video"
          }
        >
          Render ▸
        </button>
        <span className={styles.settingsAnchor}>
          <button
            className={`${styles.iconButton} ${settingsOpen ? styles.iconButtonActive : ""}`}
            onClick={() => setSettingsOpen(!settingsOpen)}
            title="Video settings: its shape, how the date shows, when the story starts"
          >
            ⚙
          </button>
          {settingsOpen && (
            <VideoSettings
              firstMarch={firstMarch}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </span>
        <button
          className={styles.iconButton}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Collapse the timeline" : "Expand the timeline"}
        >
          {expanded ? "▾" : "▴"}
        </button>
      </div>

      {previewAt !== null && (
        <FramePreview seconds={previewAt} onClose={() => setPreviewAt(null)} />
      )}
    </div>
  );
}

export default Transport;
