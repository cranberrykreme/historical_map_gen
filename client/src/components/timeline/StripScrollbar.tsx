import React, { useRef } from "react";
import { clampStripView, StripView } from "../../utils/history/stripView";
import styles from "./Timeline.module.css";

// A thin scrollbar under Video mode's lanes, shown while they're zoomed in on part of the
// video. Drag the thumb to slide along; click either side of it to jump there; double-click
// to see the whole video again.
function StripScrollbar({
  view,
  total,
  onView,
}: {
  view: StripView;
  total: number;
  onView: (view: StripView | null) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const length = Math.max(total, 1);
  const width = view.to - view.from;

  const secondsAt = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return ((clientX - rect.left) / rect.width) * length;
  };

  const startDrag = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const at = secondsAt(e.clientX);
    const onThumb = at >= view.from && at <= view.to;
    // Off the thumb, jump so the thumb is centred there, then drag from there
    const base = onThumb
      ? view
      : (clampStripView({ from: at - width / 2, to: at + width / 2 }, total) ??
        view);
    if (!onThumb) onView(base);
    const onMove = (ev: MouseEvent) => {
      const shift = secondsAt(ev.clientX) - at;
      onView(
        clampStripView({ from: base.from + shift, to: base.to + shift }, total)
      );
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className={styles.stripScroll}>
      <button
        className={styles.textButton}
        onClick={() => onView(null)}
        title="Show the whole video (or double-click the bar)"
      >
        Fit
      </button>
      <div
        ref={barRef}
        className={styles.stripScrollBar}
        onMouseDown={startDrag}
        onDoubleClick={() => onView(null)}
        title="Drag to slide along the video; double-click to see all of it"
      >
        <div
          className={styles.stripScrollThumb}
          style={{
            left: `${(view.from / length) * 100}%`,
            width: `${(width / length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

export default StripScrollbar;
