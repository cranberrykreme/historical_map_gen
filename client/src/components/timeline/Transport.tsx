import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { isPastStart, useTimelineStore } from "../../store/useTimelineStore";
import { formatHistoryTime, HistoryTime, HOUR } from "../../utils/historyTime";
import { RowFilter } from "../../utils/timelineRows";
import { HistoryDisplay } from "../../types";
import styles from "./Timeline.module.css";

// How much history plays per second of preview
const PACES: { days: number; label: string }[] = [
  { days: HOUR, label: "1 hr" },
  { days: 6 * HOUR, label: "6 hr" },
  { days: 1, label: "1 day" },
  { days: 7, label: "1 wk" },
  { days: 365.2425 / 12, label: "1 mo" },
  { days: 365.2425, label: "1 yr" },
];

const DISPLAYS: { mode: HistoryDisplay; label: string }[] = [
  { mode: "months", label: "Months" },
  { mode: "days", label: "Days" },
  { mode: "times", label: "Times" },
];

const FILTERS: { filter: RowFilter; label: string; hint: string }[] = [
  { filter: "all", label: "All", hint: "List every march" },
  {
    filter: "now",
    label: "Now",
    hint: "List only the marches under way at the playhead",
  },
  {
    filter: "view",
    label: "In view",
    hint: "List the marches in the stretch of history on show",
  },
];

// The timeline's control strip: play and rewind, the pace, how dates are shown, Fit, which
// marches are listed, and the button that folds the timeline away
function Transport({
  current,
  hasMarches,
  storyEnd,
}: {
  current: HistoryTime;
  hasMarches: boolean;
  storyEnd: HistoryTime | null;
}) {
  const storyStart = useMapStore((state) => state.storyStart);
  const displayMode = useMapStore((state) => state.displayMode);
  const setDisplayMode = useMapStore((state) => state.setDisplayMode);

  const now = useTimelineStore((state) => state.now);
  const playing = useTimelineStore((state) => state.playing);
  const pace = useTimelineStore((state) => state.pace);
  const expanded = useTimelineStore((state) => state.expanded);
  const view = useTimelineStore((state) => state.view);
  const setNow = useTimelineStore((state) => state.setNow);
  const play = useTimelineStore((state) => state.play);
  const pause = useTimelineStore((state) => state.pause);
  const setPace = useTimelineStore((state) => state.setPace);
  const setExpanded = useTimelineStore((state) => state.setExpanded);
  const setView = useTimelineStore((state) => state.setView);
  const rowFilter = useTimelineStore((state) => state.rowFilter);
  const setRowFilter = useTimelineStore((state) => state.setRowFilter);

  const handlePlay = () => {
    if (playing) {
      pause();
      return;
    }
    usePathToolStore.getState().clearPreview(); // the timeline and a path preview never both play
    if (storyEnd !== null && current >= storyEnd - 1e-9) setNow(null);
    play();
  };

  const handleRewind = () => {
    pause();
    setNow(null);
  };

  return (
    <div className={styles.transport}>
      <button
        className={styles.iconButton}
        onClick={handleRewind}
        title="Back to the start of the story (units can be edited there)"
      >
        {"⏮︎"}
      </button>
      <button
        className={styles.playButton}
        onClick={handlePlay}
        disabled={!hasMarches}
        title={playing ? "Pause" : "Play"}
      >
        {playing ? "❚❚" : "▶︎"}
      </button>
      <span className={styles.time}>{formatHistoryTime(current, "times")}</span>
      <span className={styles.modeLabel}>Per second</span>
      <div className={styles.speed}>
        {PACES.map(({ days, label }) => (
          <button
            key={label}
            className={`${styles.speedButton} ${pace === days ? styles.speedActive : ""}`}
            onClick={() => setPace(days)}
          >
            {label}
          </button>
        ))}
      </div>
      <span className={styles.modeLabel}>Date</span>
      <div className={styles.speed} title="How the date is shown on screen">
        {DISPLAYS.map(({ mode, label }) => (
          <button
            key={mode}
            className={`${styles.speedButton} ${displayMode === mode ? styles.speedActive : ""}`}
            onClick={() => setDisplayMode(mode)}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        className={styles.textButton}
        onClick={() => setView(null)}
        disabled={view === null}
        title="Show the whole story (pinch or ⌘-scroll on the bars to zoom, swipe sideways or Shift-scroll to pan)"
      >
        Fit
      </button>
      <span className={styles.modeLabel}>Show</span>
      <div className={styles.speed} title="Which marches are listed">
        {FILTERS.map(({ filter, label, hint }) => (
          <button
            key={filter}
            title={hint}
            className={`${styles.speedButton} ${rowFilter === filter ? styles.speedActive : ""}`}
            onClick={() => setRowFilter(filter)}
          >
            {label}
          </button>
        ))}
      </div>
      {isPastStart(now, storyStart) && !playing && (
        <span className={styles.note}>
          Units can only be moved at the moment they appear
        </span>
      )}
      <div className={styles.spacer} />
      <button
        className={styles.iconButton}
        onClick={() => setExpanded(!expanded)}
        title={expanded ? "Collapse the timeline" : "Expand the timeline"}
      >
        {expanded ? "▾" : "▴"}
      </button>
    </div>
  );
}

export default Transport;
