import React, { useRef, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { Shot } from "../../types";
import { formatDuration, formatHistoryTime } from "../../utils/historyTime";
import {
  dropIndex,
  formatSeconds,
  isHeld,
  MIN_SHOT_SECONDS,
  shotAt,
  shotStarts,
  videoLength,
} from "../../utils/shots";
import { barPlacement, fitView, viewShowing } from "../../utils/timeline";
import styles from "./Timeline.module.css";

const SNAP_SECONDS = 0.5; // dragging a shot's end snaps to half seconds
const DRAG_THRESHOLD = 4; // pixels the pointer moves before a press becomes a drag

// What a shot shows, for its tooltip
export function describeShot(shot: Shot): string {
  const span = isHeld(shot)
    ? `Holds ${formatHistoryTime(shot.from, "times")}`
    : `${formatHistoryTime(shot.from, "times")} to ${formatHistoryTime(
        shot.to,
        "times"
      )} (${formatDuration(shot.to - shot.from)})`;
  return [
    `${shot.name}: ${formatSeconds(shot.seconds)} of video`,
    span,
    shot.ease ? "Eases in and out" : "",
    shot.hideDate ? "Date hidden" : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// A shot being reordered or made longer or shorter, shown before it is saved
type Drag =
  | { kind: "move"; id: string; index: number }
  | { kind: "length"; id: string; seconds: number; scale: number };

// The video strip: the shots in the order they play, each as wide as its share of the video.
// Click a shot to select it, drag it sideways to reorder, drag its right edge to change its
// length. In video mode a press on the strip scrubs the video playhead instead (a click
// without dragging still selects the shot under it).
function VideoStrip({ storyEnd }: { storyEnd: number | null }) {
  const shots = useMapStore((state) => state.shots);
  const selectedShotId = useMapStore((state) => state.selectedShotId);
  const storyStart = useMapStore((state) => state.storyStart);
  const selectShot = useMapStore((state) => state.selectShot);
  const selectPath = useMapStore((state) => state.selectPath);
  const addShot = useMapStore((state) => state.addShot);
  const updateShot = useMapStore((state) => state.updateShot);
  const moveShotTo = useMapStore((state) => state.moveShotTo);

  const inVideo = useTimelineStore((state) => state.mode === "video");
  const videoTime = useTimelineStore((state) => state.videoTime);

  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  // A shot whose length is being dragged shows its draft length
  const shown =
    drag?.kind === "length"
      ? shots.map((shot) =>
          shot.id === drag.id ? { ...shot, seconds: drag.seconds } : shot
        )
      : shots;
  const total = videoLength(shown);
  // While a length is dragged the scale holds still, so the strip doesn't slide about
  const scale = drag?.kind === "length" ? drag.scale : Math.max(total, 1);
  const starts = shotStarts(shown);
  const percent = (seconds: number) => (seconds / scale) * 100;

  // Selecting a shot shows its stretch of history on the timeline below
  const select = (shot: Shot) => {
    selectPath(null);
    selectShot(shot.id);
    const timeline = useTimelineStore.getState();
    const visible = timeline.view ?? fitView(storyStart, storyEnd);
    const timing = { start: shot.from, end: shot.to, turn: 0 };
    if (barPlacement(timing, visible) !== "inside") {
      timeline.setView(viewShowing(timing, visible));
    }
  };

  const secondsAt = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return ((clientX - rect.left) / rect.width) * scale;
  };

  // Press on a shot: select it, and if the pointer then moves, drag it to a new place
  const startMove = (e: React.MouseEvent, shot: Shot) => {
    if (e.button !== 0) return;
    e.preventDefault();
    select(shot);
    const startX = e.clientX;
    let moving = false;
    let index = shots.findIndex((s) => s.id === shot.id);

    const onMove = (ev: MouseEvent) => {
      if (!moving && Math.abs(ev.clientX - startX) < DRAG_THRESHOLD) return;
      moving = true;
      index = dropIndex(shots, shot.id, secondsAt(ev.clientX));
      setDrag({ kind: "move", id: shot.id, index });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setDrag(null);
      if (moving) moveShotTo(shot.id, index);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Video mode: press and drag along the strip to move the video playhead
  const startScrub = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const timeline = useTimelineStore.getState();
    timeline.pause();
    const end = videoLength(shots);
    const scrubTo = (clientX: number) =>
      useTimelineStore
        .getState()
        .setVideoTime(Math.min(Math.max(secondsAt(clientX), 0), end));
    scrubTo(e.clientX);
    const startX = e.clientX;
    let moved = false;

    const onMove = (ev: MouseEvent) => {
      if (Math.abs(ev.clientX - startX) >= DRAG_THRESHOLD) moved = true;
      scrubTo(ev.clientX);
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (!moved) {
        const place = shotAt(shots, secondsAt(ev.clientX));
        if (place) select(place.shot);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Drag a shot's right edge to make it longer or shorter on the video
  const startLength = (e: React.MouseEvent, shot: Shot) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    select(shot);
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const frozenScale = Math.max(videoLength(shots), 1);
    const secondsPerPixel = frozenScale / rect.width;
    const startX = e.clientX;
    let seconds = shot.seconds;

    const onMove = (ev: MouseEvent) => {
      const raw = shot.seconds + (ev.clientX - startX) * secondsPerPixel;
      seconds = Math.max(
        Math.round(raw / SNAP_SECONDS) * SNAP_SECONDS,
        MIN_SHOT_SECONDS
      );
      setDrag({ kind: "length", id: shot.id, seconds, scale: frozenScale });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setDrag(null);
      if (seconds !== shot.seconds) updateShot(shot.id, { seconds });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // A new shot goes after the selected one. The very first covers the whole story.
  const handleAdd = () => {
    if (shots.length === 0) {
      addShot({
        from: storyStart,
        to:
          storyEnd !== null && storyEnd > storyStart
            ? storyEnd
            : storyStart + 7,
      });
    } else {
      addShot();
    }
    selectPath(null);
  };

  // Where a dragged shot would land, as a line between shots
  const insertAt = (() => {
    if (drag?.kind !== "move") return null;
    const from = shots.findIndex((shot) => shot.id === drag.id);
    if (drag.index === from) return starts[from]; // staying where it is
    const others = shots.filter((shot) => shot.id !== drag.id);
    const next = others[drag.index];
    return next ? starts[shots.indexOf(next)] : total;
  })();

  return (
    <div className={styles.videoStrip}>
      <div className={styles.videoLabel}>
        <span className={styles.videoTitle} title="How long the video is">
          Video {formatSeconds(total)}
        </span>
        <button
          className={styles.addShot}
          onClick={handleAdd}
          title="Add a shot after the selected one"
        >
          + Shot
        </button>
      </div>
      <div
        className={`${styles.videoTrack} ${inVideo ? styles.videoScrub : ""}`}
        ref={trackRef}
        onMouseDown={inVideo ? startScrub : undefined}
      >
        {shots.length === 0 && (
          <div className={styles.videoEmpty}>
            No shots yet. A shot is a stretch of video showing a stretch of
            history; click + Shot to add one.
          </div>
        )}
        {shown.map((shot, i) => (
          <div
            key={shot.id}
            className={[
              styles.shotBlock,
              shot.id === selectedShotId ? styles.shotActive : "",
              isHeld(shot) ? styles.shotHeld : "",
              drag?.kind === "move" && drag.id === shot.id
                ? styles.shotDragging
                : "",
            ].join(" ")}
            style={{
              left: `${percent(starts[i])}%`,
              width: `${percent(shot.seconds)}%`,
            }}
            title={describeShot(shot)}
            onMouseDown={inVideo ? undefined : (e) => startMove(e, shot)}
          >
            <span className={styles.shotName}>{shot.name}</span>
            <span className={styles.shotSeconds}>
              {formatSeconds(shot.seconds)}
              {shot.ease ? " ~" : ""}
            </span>
            <div
              className={styles.shotHandle}
              title="Drag to make this shot longer or shorter"
              onMouseDown={(e) => startLength(e, shot)}
            />
          </div>
        ))}
        {inVideo && shots.length > 0 && (
          <div
            className={styles.videoPlayhead}
            style={{ left: `${percent(Math.min(videoTime, total))}%` }}
          />
        )}
        {insertAt !== null && (
          <div
            className={styles.shotInsert}
            style={{ left: `${percent(insertAt)}%` }}
          />
        )}
      </div>
    </div>
  );
}

export default VideoStrip;
