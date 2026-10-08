import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import {
  barPlacement,
  HistoryView,
  keepAfter,
  snapStepFor,
  viewShowing,
} from "../../utils/timeline";
import { dragMarch, MarchDragMode } from "../../utils/marches";
import { MapPath, MarchTiming } from "../../types";
import { describe } from "./describe";
import styles from "./Timeline.module.css";

// The arrow at a row's edge when its bar is outside the stretch of history on show. Click it
// to bring the bar into view.
const OFFSCREEN: React.CSSProperties = {
  position: "absolute",
  top: 4,
  bottom: 4,
  width: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--color-gold-subtle)",
  border: "1px solid var(--color-gold-dim)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-gold)",
  fontSize: 10,
  cursor: "pointer",
  zIndex: 2,
};

export const MIN_BAR_PX = 6; // a very short march still gets a bar you can see and grab

// One march's row of the bars: its bar with the drag handles, or an arrow at the edge when
// the bar is out of view
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
  const setView = useTimelineStore((state) => state.setView);

  const span = shown.to - shown.from;
  const percent = (t: number) => ((t - shown.from) / span) * 100;

  const reveal = (e: React.MouseEvent) => {
    e.stopPropagation(); // not a playhead scrub
    e.preventDefault();
    selectPath(path.id);
    setView(viewShowing(timing, shown));
  };

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

  return (
    <div className={styles.row}>
      {placement === "before" && (
        <div
          style={{ ...OFFSCREEN, left: 2 }}
          title={`Earlier: ${describe(timing)}\nClick to show it`}
          onMouseDown={reveal}
        >
          {"◂"}
        </div>
      )}
      {placement === "after" && (
        <div
          style={{ ...OFFSCREEN, right: 2 }}
          title={`Later: ${describe(timing)}\nClick to show it`}
          onMouseDown={reveal}
        >
          {"▸"}
        </div>
      )}
      <div
        className={`${styles.bar} ${active ? styles.barActive : ""}`}
        style={{
          left: `${percent(timing.start)}%`,
          width: `${(length / span) * 100}%`,
          minWidth: MIN_BAR_PX,
          display: placement === "inside" ? undefined : "none",
        }}
        title={describe(timing)}
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
    </div>
  );
}

export default MarchBar;
