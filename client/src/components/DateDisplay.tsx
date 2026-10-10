import React from "react";
import { useMapStore } from "../store/useMapStore";
import { currentMoment, useTimelineStore } from "../store/useTimelineStore";
import { formatHistoryTime } from "../utils/historyTime";
import { dateHiddenAt } from "../utils/shots";
import styles from "./DateDisplay.module.css";

// The date in the corner of the screen: the moment in history the playhead is at. While the
// video plays, a shot can hide it (for a title card, say).
function DateDisplay() {
  const storyStart = useMapStore((state) => state.storyStart);
  const displayMode = useMapStore((state) => state.displayMode);
  const shots = useMapStore((state) => state.shots);
  const now = useTimelineStore((state) => state.now);
  const hidden = useTimelineStore(
    (state) => state.mode === "video" && dateHiddenAt(shots, state.videoTime)
  );

  if (hidden) return null;

  return (
    <div className={styles.date}>
      {formatHistoryTime(currentMoment(now, storyStart), displayMode)}
    </div>
  );
}

export default DateDisplay;
