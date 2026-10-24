import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import {
  barPlacement,
  HistoryView,
  keepAfter,
  snapStepFor,
} from "../../utils/history/timeline";
import { dragMarch, MarchDragMode } from "../../utils/marches/marches";
import { MapPath, MarchTiming } from "../../types";
import { describe } from "./describe";
import styles from "./Timeline.module.css";

export const MIN_BAR_PX = 6; // a very short march still gets a bar you can see and grab

// A march's bar on a unit's row, with its drag handles. A march carrying several units shows
// on each of their rows; dragging any of them moves the march.
function MarchBar({
  path,
  timing,
  active,
  shown,
  trackRef,
}: {
  path: MapPath;
  timing: MarchTiming;
  active: boolean;
  shown: HistoryView;
  trackRef: React.RefObject<HTMLDivElement | null>;
}) {
  const selectPath = useMapStore((state) => state.selectPath);
  const setMarchTiming = useMapStore((state) => state.setMarchTiming);
  const storyStart = useMapStore((state) => state.storyStart);
  const setDraftTiming = useTimelineStore((state) => state.setDraftTiming);

  const span = shown.to - shown.from;
  const percent = (t: number) => ((t - shown.from) / span) * 100;

  // Dragging a bar moves the march; its ends change its dates; the line between the turn
  // and the march changes how long the turn takes
  const startBarDrag = (e: React.MouseEvent, mode: MarchDragMode) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // not a playhead scrub
    e.preventDefault();
    selectPath(path.id);

    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const daysPerPixel = span / rect.width;
    const snap = snapStepFor(daysPerPixel);
    const startX = e.clientX;
    let latest = timing;

    const onMove = (ev: MouseEvent) => {
      const dragged = dragMarch(
        timing,
        (ev.clientX - startX) * daysPerPixel,
        mode,
        snap
      );
      latest = keepAfter(dragged, storyStart, mode === "move");
      setDraftTiming({ pathId: path.id, timing: latest });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setDraftTiming(null);
      if (
        latest.start !== timing.start ||
        latest.end !== timing.end ||
        latest.turn !== timing.turn
      ) {
        setMarchTiming(path.id, latest);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const length = timing.end - timing.start;
  const turnShare = length > 0 ? (timing.turn / length) * 100 : 0;
  const placement = barPlacement(timing, shown);

  if (placement !== "inside") return null;
  return (
    <div
      className={`${styles.bar} ${active ? styles.barActive : ""}`}
      style={{
        left: `${percent(timing.start)}%`,
        width: `${(length / span) * 100}%`,
        minWidth: MIN_BAR_PX,
      }}
      title={`${path.name}\n${describe(timing)}`}
      onMouseDown={(e) => startBarDrag(e, "move")}
    >
      <div className={styles.barTurn} style={{ width: `${turnShare}%` }} />
      <div className={styles.barMarch} style={{ left: `${turnShare}%` }} />
      <div
        className={styles.splitHandle}
        style={{ left: `${turnShare}%` }}
        title="Drag to change how long the turn takes"
        onMouseDown={(e) => startBarDrag(e, "split")}
      />
      <div
        className={`${styles.handle} ${styles.handleStart}`}
        onMouseDown={(e) => startBarDrag(e, "start")}
      />
      <div
        className={`${styles.handle} ${styles.handleEnd}`}
        onMouseDown={(e) => startBarDrag(e, "end")}
      />
    </div>
  );
}

export default MarchBar;
