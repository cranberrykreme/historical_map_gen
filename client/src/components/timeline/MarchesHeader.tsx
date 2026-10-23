import React from "react";
import { useTimelineStore } from "../../store/useTimelineStore";
import { RowFilter } from "../../utils/history/timelineRows";
import styles from "./Timeline.module.css";

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

// The marches' own header, above their rows: Fit, and which marches are listed
function MarchesHeader() {
  const view = useTimelineStore((state) => state.view);
  const setView = useTimelineStore((state) => state.setView);
  const rowFilter = useTimelineStore((state) => state.rowFilter);
  const setRowFilter = useTimelineStore((state) => state.setRowFilter);

  return (
    <div className={styles.marchesHeader}>
      <span className={styles.marchesTitle}>Marches</span>
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
    </div>
  );
}

export default MarchesHeader;
