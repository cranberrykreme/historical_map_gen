import React from "react";
import { useMapStore } from "../store/useMapStore";
import { currentMoment, useTimelineStore } from "../store/useTimelineStore";
import { formatHistoryTime } from "../utils/historyTime";
import styles from "./DateDisplay.module.css";

// The date in the corner of the screen: the moment in history the playhead is at
function DateDisplay() {
  const storyStart = useMapStore((state) => state.storyStart);
  const displayMode = useMapStore((state) => state.displayMode);
  const now = useTimelineStore((state) => state.now);

  return (
    <div className={styles.date}>
      {formatHistoryTime(currentMoment(now, storyStart), displayMode)}
    </div>
  );
}

export default DateDisplay;
