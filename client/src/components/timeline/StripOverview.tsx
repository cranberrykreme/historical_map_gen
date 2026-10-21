import React, { useRef, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { Shot } from "../../types";
import { Chapter } from "../../utils/video/chapters";
import { formatSeconds, shotAt } from "../../utils/video/shots";
import { clampStripView, StripView } from "../../utils/history/stripView";
import styles from "./Timeline.module.css";

const DRAG_THRESHOLD = 4; // pixels the pointer moves before a press becomes a drag
const EDGE = 5; // pixels either side of the window's edges that resize it

type Press = "pan" | "left" | "right" | "range";

// The whole video in a thin bar above the video strip: its chapters, every cut, the selected
// shot, the playhead, and (when the strip is zoomed in) a window over the part the strip shows.
// Drag the window to slide the strip along, drag its edges to zoom, drag across the bar to zoom
// to that stretch, click to jump there, double-click to show the whole video again.
function StripOverview({
  shots,
  starts,
  total,
  chapters,
  view,
  selectedIndex,
  playhead,
  onView,
}: {
  shots: Shot[];
  starts: number[];
  total: number;
  chapters: Chapter[];
  view: StripView | null; // null: the strip shows the whole video
  selectedIndex: number;
  playhead: number | null; // in video mode
  onView: (view: StripView | null) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<StripView | null>(null);
  const length = Math.max(total, 1);
  const percent = (seconds: number) => (seconds / length) * 100;

  const secondsAt = (clientX: number): number => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.min(
      Math.max(((clientX - rect.left) / rect.width) * length, 0),
      length
    );
  };

  // What a press does depends on where it lands: on the window's edges, inside it, or outside
  const pressAt = (clientX: number): Press => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!view || !rect) return "range";
    const x = clientX - rect.left;
    const left = (view.from / length) * rect.width;
    const right = (view.to / length) * rect.width;
    if (Math.abs(x - left) <= EDGE) return "left";
    if (Math.abs(x - right) <= EDGE) return "right";
    if (x > left && x < right) return "pan";
    return "range";
  };

  const startPress = (e: React.MouseEvent) => {
    if (e.button !== 0 || shots.length === 0) return;
    e.preventDefault();
    const press = pressAt(e.clientX);
    const startX = e.clientX;
    const startSeconds = secondsAt(e.clientX);
    const base = view;
    let moved = false;

    const onMove = (ev: MouseEvent) => {
      if (!moved && Math.abs(ev.clientX - startX) < DRAG_THRESHOLD) return;
      moved = true;
      const at = secondsAt(ev.clientX);
      if (press === "pan" && base) {
        const shift = at - startSeconds;
        onView(
          clampStripView(
            { from: base.from + shift, to: base.to + shift },
            total
          )
        );
      } else if (press === "left" && base) {
        onView(
          clampStripView({ from: Math.min(at, base.to), to: base.to }, total)
        );
      } else if (press === "right" && base) {
        onView(
          clampStripView(
            { from: base.from, to: Math.max(at, base.from) },
            total
          )
        );
      } else {
        setRange({
          from: Math.min(at, startSeconds),
          to: Math.max(at, startSeconds),
        });
      }
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setRange(null);
      const at = secondsAt(ev.clientX);
      if (moved) {
        if (press === "range")
          onView(
            clampStripView(
              {
                from: Math.min(at, startSeconds),
                to: Math.max(at, startSeconds),
              },
              total
            )
          );
        return;
      }
      // A click: zoomed in, the strip jumps there; showing everything, the shot there is selected
      if (base && press === "range") {
        const width = base.to - base.from;
        onView(
          clampStripView({ from: at - width / 2, to: at + width / 2 }, total)
        );
      } else if (!base) {
        const place = shotAt(shots, at);
        if (place) useMapStore.getState().selectShot(place.shot.id);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Every cut, as one drawing so thousands of shots stay cheap
  const cuts = starts
    .slice(1)
    .map((start) => `M${start} 0V1`)
    .join("");
  const selected =
    selectedIndex >= 0 && shots[selectedIndex]
      ? { from: starts[selectedIndex], seconds: shots[selectedIndex].seconds }
      : null;
  const named = chapters.filter((chapter) => chapter.name !== null);

  return (
    <div className={styles.overviewRow}>
      <div className={styles.overviewLabel}>
        {view ? (
          <button
            className={styles.textButton}
            onClick={() => onView(null)}
            title="Show the whole video in the strip (or double-click the bar)"
          >
            Fit
          </button>
        ) : (
          <span className={styles.editorDim}>
            {shots.length} shot{shots.length === 1 ? "" : "s"}
            {named.length > 0 ? ` · ${named.length} ch.` : ""}
          </span>
        )}
      </div>
      <div
        ref={barRef}
        className={styles.overviewBar}
        onMouseDown={startPress}
        onDoubleClick={() => onView(null)}
        onMouseMove={(e) => {
          const press = pressAt(e.clientX);
          e.currentTarget.style.cursor =
            press === "left" || press === "right"
              ? "ew-resize"
              : press === "pan"
                ? "grab"
                : "crosshair";
        }}
        title="The whole video. Drag across it to zoom the strip in, drag the window to slide along, double-click to see everything."
      >
        {chapters.map((chapter, i) => (
          <div
            key={`band-${chapter.first}`}
            className={`${styles.overviewChapter} ${
              i % 2 === 1 ? styles.overviewChapterAlt : ""
            }`}
            style={{
              left: `${percent(chapter.from)}%`,
              width: `${percent(chapter.to - chapter.from)}%`,
            }}
            title={`${chapter.name ?? "Before the first chapter"}: ${formatSeconds(
              chapter.from
            )} to ${formatSeconds(chapter.to)}, ${chapter.last - chapter.first + 1} shot${
              chapter.last === chapter.first ? "" : "s"
            }`}
          >
            {chapter.name && (
              <span className={styles.overviewChapterName}>{chapter.name}</span>
            )}
          </div>
        ))}
        <svg
          className={styles.overviewCuts}
          viewBox={`0 0 ${length} 1`}
          preserveAspectRatio="none"
        >
          <path d={cuts} vectorEffect="non-scaling-stroke" />
        </svg>
        {selected && (
          <div
            className={styles.overviewSelected}
            style={{
              left: `${percent(selected.from)}%`,
              width: `${percent(selected.seconds)}%`,
            }}
          />
        )}
        {playhead !== null && (
          <div
            className={styles.overviewPlayhead}
            style={{ left: `${percent(playhead)}%` }}
          />
        )}
        {view && (
          <div
            className={styles.overviewWindow}
            style={{
              left: `${percent(view.from)}%`,
              width: `${percent(view.to - view.from)}%`,
            }}
          />
        )}
        {range && (
          <div
            className={styles.overviewRange}
            style={{
              left: `${percent(range.from)}%`,
              width: `${percent(range.to - range.from)}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default StripOverview;
