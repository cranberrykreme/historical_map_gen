import React from "react";
import { useTimelineStore } from "../../store/useTimelineStore";
import { COMING_LATER, ShowFilter } from "../../utils/history/timelineRows";
import styles from "./Timeline.module.css";

const FILTERS: { filter: ShowFilter; label: string; hint: string }[] = [
  {
    filter: "everything",
    label: "Everything",
    hint: "Every unit, with everything that happens to it",
  },
  {
    filter: "marches",
    label: "Marches",
    hint: "Only the units that march, with just their marches",
  },
  {
    filter: "battle",
    label: "Battle",
    hint: "Clashes, volleys and routs",
  },
  {
    filter: "map",
    label: "Map",
    hint: "Things on the map itself: arrows, labels, pins and borders",
  },
];

// Above the rows in History mode: what they show, and Fit
function RowsHeader() {
  const view = useTimelineStore((state) => state.view);
  const setView = useTimelineStore((state) => state.setView);
  const rowFilter = useTimelineStore((state) => state.rowFilter);
  const setRowFilter = useTimelineStore((state) => state.setRowFilter);

  return (
    <div className={styles.marchesHeader}>
      <span className={styles.modeLabel}>Show</span>
      <div className={styles.speed} title="What the rows show">
        {FILTERS.map(({ filter, label, hint }) => {
          const later = COMING_LATER[filter];
          return (
            <button
              key={filter}
              title={later ? `${hint} (these arrive in ${later})` : hint}
              disabled={!!later}
              className={`${styles.speedButton} ${rowFilter === filter ? styles.speedActive : ""}`}
              onClick={() => setRowFilter(filter)}
            >
              {label}
            </button>
          );
        })}
      </div>
      <button
        className={styles.textButton}
        onClick={() => setView(null)}
        disabled={view === null}
        title="Show the whole story (pinch or ⌘-scroll on the rows to zoom, swipe sideways or Shift-scroll to pan)"
      >
        Fit
      </button>
    </div>
  );
}

export default RowsHeader;
