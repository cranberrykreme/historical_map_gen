import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { Shot } from "../../types";
import {
  formatDuration,
  formatHistoryTime,
} from "../../utils/history/historyTime";
import {
  dropIndex,
  formatSeconds,
  isHeld,
  MIN_SHOT_SECONDS,
  shotStarts,
  videoLength,
} from "../../utils/video/shots";
import {
  barPlacement,
  fitView,
  viewShowing,
} from "../../utils/history/timeline";
import { transitionSpans } from "../../utils/video/camera";
import { chaptersOf } from "../../utils/video/chapters";
import {
  panStripView,
  revealInStrip,
  shotsInView,
  StripView,
  wholeStrip,
  zoomStripView,
} from "../../utils/history/stripView";
import StripOverview from "./StripOverview";
import styles from "./Timeline.module.css";
import { findBattle } from "../../utils/scenes/kinds";

const SNAP_SECONDS = 0.5; // dragging a shot's end snaps to half seconds
const DRAG_THRESHOLD = 4; // pixels the pointer moves before a press becomes a drag
const ZOOM_SPEED = 0.01; // per unit of pinch or ⌘-scroll

// What a shot shows, for its tooltip
export function describeShot(shot: Shot, battleName?: string): string {
  const span = isHeld(shot)
    ? `Holds ${formatHistoryTime(shot.from, "times")}`
    : `${formatHistoryTime(shot.from, "times")} to ${formatHistoryTime(
        shot.to,
        "times"
      )} (${formatDuration(shot.to - shot.from)})`;
  return [
    `${shot.name}: ${formatSeconds(shot.seconds)} of video`,
    shot.scene ? `Battle: ${battleName ?? "(deleted)"}` : "",
    span,
    shot.ease ? "Eases in and out" : "",
    shot.hideDate ? "Date hidden" : "",
    shot.transition ? `In: ${shot.transition.kind}` : "",
    shot.startView || shot.endView ? "Camera set" : "",
    shot.follow ? "Follows an army" : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// A shot being reordered or made longer or shorter, shown before it is saved
type Drag =
  | { kind: "move"; id: string; index: number }
  | { kind: "length"; id: string; seconds: number; view: StripView };

// The video strip: the shots in the order they play, each as wide as its share of the video.
// Click a shot to select it, drag it sideways to reorder, drag its right edge to change its
// length. In video mode, grab the playhead to scrub the video. Pinch (or ⌘-scroll) to zoom in
// on part of a long video and scroll to slide along it; the overview bar above shows the whole
// video, its chapters and where the strip is looking. Only the shots in view are drawn.
function VideoStrip({ storyEnd }: { storyEnd: number | null }) {
  const shots = useMapStore((state) => state.shots);
  const battles = useMapStore((state) => state.battles);
  const selectedShotId = useMapStore((state) => state.selectedShotId);
  const storyStart = useMapStore((state) => state.storyStart);
  const selectShot = useMapStore((state) => state.selectShot);
  const selectPath = useMapStore((state) => state.selectPath);
  const addShot = useMapStore((state) => state.addShot);
  const updateShot = useMapStore((state) => state.updateShot);
  const moveShotTo = useMapStore((state) => state.moveShotTo);

  const inVideo = useTimelineStore((state) => state.mode === "video");
  const videoTime = useTimelineStore((state) => state.videoTime);
  const playing = useTimelineStore((state) => state.playing);
  const stripView = useTimelineStore((state) => state.stripView);
  const setStripView = useTimelineStore((state) => state.setStripView);

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
  // The stretch of video in view. While a length is dragged it holds still, so the strip
  // doesn't slide about.
  const view: StripView =
    drag?.kind === "length" ? drag.view : (stripView ?? wholeStrip(total));
  const span = view.to - view.from;
  const starts = useMemo(() => shotStarts(shown), [shown]);
  const lengths = useMemo(() => shown.map((shot) => shot.seconds), [shown]);
  const chapters = useMemo(() => chaptersOf(shots), [shots]);
  // Where a moment of the video sits across the strip, and how wide a stretch of it is
  const percent = (seconds: number) => ((seconds - view.from) / span) * 100;
  const widthOf = (seconds: number) => (seconds / span) * 100;
  const [firstShown, endShown] = shotsInView(starts, lengths, view);

  // The latest view and length, for the wheel handler (attached once)
  const viewRef = useRef({ view, total });
  viewRef.current = { view, total };

  // Pinching (or ⌘/Ctrl-scrolling) zooms about the pointer; any other scrolling slides along
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handleWheel = (e: WheelEvent) => {
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) return;
      e.preventDefault();
      const { view: base, total: length } = viewRef.current;
      const baseSpan = base.to - base.from;
      if (e.ctrlKey || e.metaKey) {
        const anchor =
          base.from + ((e.clientX - rect.left) / rect.width) * baseSpan;
        setStripView(
          zoomStripView(base, anchor, Math.exp(e.deltaY * ZOOM_SPEED), length)
        );
        return;
      }
      const pixels =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      setStripView(
        panStripView(base, (pixels / rect.width) * baseSpan, length)
      );
    };
    track.addEventListener("wheel", handleWheel, { passive: false });
    return () => track.removeEventListener("wheel", handleWheel);
  }, [setStripView]);

  // A shot selected anywhere (the shot list, the overview) slides into view
  useEffect(() => {
    if (!stripView) return;
    const index = shots.findIndex((shot) => shot.id === selectedShotId);
    if (index < 0) return;
    const start = shotStarts(shots)[index];
    const next = revealInStrip(
      stripView,
      start,
      start + shots[index].seconds,
      total
    );
    if (next !== stripView) setStripView(next);
    // Only when the selection changes, not on every edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShotId]);

  // While the video plays, the strip turns the page to keep the playhead in view
  useEffect(() => {
    if (!inVideo || !playing || !stripView) return;
    if (videoTime >= stripView.from && videoTime <= stripView.to) return;
    const width = stripView.to - stripView.from;
    setStripView(
      panStripView(stripView, videoTime - width * 0.05 - stripView.from, total)
    );
  }, [inVideo, playing, videoTime, stripView, total, setStripView]);

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
    if (!rect || rect.width === 0) return view.from;
    return view.from + ((clientX - rect.left) / rect.width) * span;
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

  // Video mode: grab the playhead and drag it along the strip to scrub the video
  const startScrub = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    useTimelineStore.getState().pause();
    const end = videoLength(shots);
    const scrubTo = (clientX: number) =>
      useTimelineStore
        .getState()
        .setVideoTime(Math.min(Math.max(secondsAt(clientX), 0), end));

    const onMove = (ev: MouseEvent) => scrubTo(ev.clientX);
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
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
    const frozenView = view;
    const secondsPerPixel = (frozenView.to - frozenView.from) / rect.width;
    const startX = e.clientX;
    let seconds = shot.seconds;

    const onMove = (ev: MouseEvent) => {
      const raw = shot.seconds + (ev.clientX - startX) * secondsPerPixel;
      seconds = Math.max(
        Math.round(raw / SNAP_SECONDS) * SNAP_SECONDS,
        MIN_SHOT_SECONDS
      );
      setDrag({ kind: "length", id: shot.id, seconds, view: frozenView });
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

  const visibleShots = shown.slice(firstShown, endShown);

  return (
    <>
      <StripOverview
        shots={shots}
        starts={starts}
        total={total}
        chapters={chapters}
        view={stripView}
        selectedIndex={shots.findIndex((shot) => shot.id === selectedShotId)}
        playhead={inVideo ? Math.min(videoTime, total) : null}
        onView={setStripView}
      />
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
        <div className={styles.videoTrack} ref={trackRef}>
          {shots.length === 0 && (
            <div className={styles.videoEmpty}>
              No shots yet. A shot is a stretch of video showing a stretch of
              history; click + Shot to add one.
            </div>
          )}
          {visibleShots.map((shot, k) => {
            const i = firstShown + k;
            return (
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
                  width: `${widthOf(shot.seconds)}%`,
                }}
                title={describeShot(
                  shot,
                  findBattle(battles, shot.scene)?.name
                )}
                onMouseDown={(e) => startMove(e, shot)}
              >
                <span className={styles.shotName}>
                  {shot.scene ? "⚔ " : ""}
                  {shot.name}
                </span>
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
            );
          })}
          {/* Where each chapter starts, as a gold line between shots */}
          {chapters
            .filter(
              (chapter) =>
                chapter.name !== null &&
                chapter.from > view.from &&
                chapter.from < view.to
            )
            .map((chapter) => (
              <div
                key={`chapter-${chapter.first}`}
                className={styles.chapterLine}
                style={{ left: `${percent(chapter.from)}%` }}
                title={`${chapter.name} starts here`}
              />
            ))}
          {transitionSpans(shown)
            .filter((fade) => fade.to > view.from && fade.from < view.to)
            .map((fade, i) => (
              <div
                key={i}
                className={`${styles.shotTransition} ${
                  fade.kind === "fadeOut" ? styles.shotFadeOut : ""
                }`}
                style={{
                  left: `${percent(fade.from)}%`,
                  width: `${widthOf(fade.to - fade.from)}%`,
                }}
              />
            ))}
          {inVideo &&
            shots.length > 0 &&
            videoTime >= view.from &&
            videoTime <= view.to && (
              <div
                className={styles.videoPlayhead}
                style={{ left: `${percent(Math.min(videoTime, total))}%` }}
                onMouseDown={startScrub}
                title="Drag to scrub the video"
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
    </>
  );
}

export default VideoStrip;
