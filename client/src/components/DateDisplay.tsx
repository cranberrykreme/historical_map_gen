import React from "react";
import { useMapStore } from "../store/useMapStore";
import { useTimelineStore } from "../store/useTimelineStore";
import { dateAtTime, formatDate } from "../utils/dates";
import styles from "./DateDisplay.module.css";

// The date in the corner of the screen at the playhead. Nothing shows until there is a marker.
function DateDisplay() {
  const markers = useMapStore((state) => state.dateMarkers);
  const mode = useMapStore((state) => state.dateMode);
  const time = useTimelineStore((state) => state.time);

  const date = dateAtTime(markers, time);
  if (!date) return null;
  return <div className={styles.date}>{formatDate(date, mode)}</div>;
}

export default DateDisplay;
