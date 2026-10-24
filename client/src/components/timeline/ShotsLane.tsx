import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { Shot } from "../../types";
import {
  HistoryView,
  snapStepFor,
  viewShowing,
} from "../../utils/history/timeline";
import {
  dragShotSpan,
  ShotDragPart,
  ShotsLane,
} from "../../utils/history/shotsLane";
import { HistoryTime } from "../../utils/history/historyTime";
import { isHeld } from "../../utils/video/shots";
import { findBattle } from "../../utils/scenes/kinds";
import { describeShot } from "./VideoStrip";
import { useAddShot } from "./useAddShot";
import styles from "./Timeline.module.css";

export const LANE_LINE = 22; // pixels for each line of the lane
const LANE_PAD = 6; // pixels of room under the last line
const STICKY_LINES = 3; // a lane with more lines than this scrolls with the rows
const DRAG_THRESHOLD = 4; // pixels the pointer moves before a press on a bracket drags it
const MIN_BRACKET_PX = 6;

export const laneHeight = (lines: number) => lines * LANE_LINE + LANE_PAD;
export const laneSticks = (lines: number) => lines <= STICKY_LINES;

// A shot's stretch while one of its brackets is being dragged, before it's saved
export interface ShotDraft {
  id: string;
  from: HistoryTime;
  to: HistoryTime;
}

// The lane's name in the names column, with a button to add a shot
export function ShotsLaneLabel({
  lines,
  storyEnd,
}: {
  lines: number;
  storyEnd: HistoryTime | null;
}) {
  const addShot = useAddShot(storyEnd);
  return (
    <div
      className={`${styles.laneLabel} ${laneSticks(lines) ? styles.laneSticky : ""}`}
      style={{ height: laneHeight(lines) }}
    >
      <span className={styles.laneName}>Shots</span>
      <button
        className={styles.laneAdd}
        onClick={addShot}
        title="Add a shot after the selected one"
      >
        +
      </button>
    </div>
  );
}

// Each shot as a bracket over the stretch of history it shows, or a diamond at the moment it
// holds. Click one to select it, double-click to zoom to it, drag a bracket's ends to change
// its From and To, drag the middle to move both.
export function ShotsLaneTrack({
  lane,
  shown,
  trackRef,
  draft,
  setDraft,
}: {
  lane: ShotsLane;
  shown: HistoryView;
  trackRef: React.RefObject<HTMLDivElement | null>;
  draft: ShotDraft | null;
  setDraft: (draft: ShotDraft | null) => void;
}) {
  const selectedShotId = useMapStore((state) => state.selectedShotId);
  const battles = useMapStore((state) => state.battles);
  const selectShot = useMapStore((state) => state.selectShot);
  const selectPath = useMapStore((state) => state.selectPath);
  const updateShot = useMapStore((state) => state.updateShot);
  const setView = useTimelineStore((state) => state.setView);

  const span = shown.to - shown.from;
  const percent = (t: number) => ((t - shown.from) / span) * 100;

  const startDrag = (e: React.MouseEvent, shot: Shot, part: ShotDragPart) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // not a playhead scrub
    e.preventDefault();
    selectPath(null);
    selectShot(shot.id);

    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const daysPerPixel = span / rect.width;
    const snap = snapStepFor(daysPerPixel);
    const startX = e.clientX;
    let moved = false;
    let latest = { from: shot.from, to: shot.to };

    const onMove = (ev: MouseEvent) => {
      if (!moved && Math.abs(ev.clientX - startX) < DRAG_THRESHOLD) return;
      moved = true;
      latest = dragShotSpan(
        shot,
        part,
        (ev.clientX - startX) * daysPerPixel,
        snap
      );
      setDraft({ id: shot.id, ...latest });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setDraft(null);
      if (moved && (latest.from !== shot.from || latest.to !== shot.to))
        updateShot(shot.id, latest);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const zoomTo = (shot: Shot) =>
    setView(viewShowing({ start: shot.from, end: shot.to, turn: 0 }, shown));

  return (
    <div
      className={`${styles.lane} ${laneSticks(lane.lines) ? styles.laneSticky : ""}`}
      style={{ height: laneHeight(lane.lines) }}
    >
      {lane.places.map(({ shot: saved, line }) => {
        const shot =
          draft && draft.id === saved.id ? { ...saved, ...draft } : saved;
        const active = shot.id === selectedShotId;
        const top = line * LANE_LINE + 3;
        const title = describeShot(shot, findBattle(battles, shot.scene)?.name);
        const name = `${shot.scene ? "⚔ " : ""}${shot.name}`;

        if (isHeld(shot))
          return (
            <div
              key={shot.id}
              className={`${styles.laneHeld} ${active ? styles.laneActive : ""}`}
              style={{ left: `${percent(shot.from)}%`, top }}
              title={`${title}\nDrag to move the moment it holds`}
              onMouseDown={(e) => startDrag(e, shot, "move")}
              onDoubleClick={() => zoomTo(shot)}
            >
              <span className={styles.laneDiamond} />
              <span className={styles.laneHeldName}>{name}</span>
            </div>
          );

        return (
          <div
            key={shot.id}
            className={`${styles.laneShot} ${active ? styles.laneActive : ""}`}
            style={{
              left: `${percent(shot.from)}%`,
              width: `${percent(shot.to) - percent(shot.from)}%`,
              minWidth: MIN_BRACKET_PX,
              top,
            }}
            title={`${title}\nDrag the ends to change From and To; double-click to zoom to it`}
            onMouseDown={(e) => startDrag(e, shot, "move")}
            onDoubleClick={() => zoomTo(shot)}
          >
            <span className={styles.laneShotName}>{name}</span>
            <div
              className={`${styles.laneEnd} ${styles.laneEndFrom}`}
              title="Drag to change From"
              onMouseDown={(e) => startDrag(e, shot, "from")}
            />
            <div
              className={`${styles.laneEnd} ${styles.laneEndTo}`}
              title="Drag to change To"
              onMouseDown={(e) => startDrag(e, shot, "to")}
            />
          </div>
        );
      })}
    </div>
  );
}
