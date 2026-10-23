import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { currentMoment, useTimelineStore } from "../../store/useTimelineStore";
import {
  fitView,
  getTimeline,
  HistoryView,
} from "../../utils/history/timeline";
import { shotAt, videoLength } from "../../utils/video/shots";
import {
  groupKeyOf,
  groupRows,
  MarchRow,
  NO_ARMY,
  RowGroup,
} from "../../utils/history/timelineRows";
import VideoStrip from "./VideoStrip";
import Transport from "./Transport";
import TimelineRows from "./TimelineRows";
import MarchesHeader from "./MarchesHeader";
import { usePlayback } from "./usePlayback";
import { useVideoClock } from "./useVideoClock";
import { useRowsHeight } from "./useRowsHeight";
import { useSelectionReveal } from "./useSelectionReveal";
import { useTimelineWheel } from "./useTimelineWheel";
import styles from "./Timeline.module.css";

function Timeline() {
  const paths = useMapStore((state) => state.paths);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const storyStart = useMapStore((state) => state.storyStart);
  const armies = useMapStore((state) => state.armies);
  const selectedArmyId = useMapStore((state) => state.selectedArmyId);
  const shots = useMapStore((state) => state.shots);
  const selectedShotId = useMapStore((state) => state.selectedShotId);
  const selectShot = useMapStore((state) => state.selectShot);

  const now = useTimelineStore((state) => state.now);
  const playing = useTimelineStore((state) => state.playing);
  const expanded = useTimelineStore((state) => state.expanded);
  const draftTiming = useTimelineStore((state) => state.draftTiming);
  const view = useTimelineStore((state) => state.view);
  const pause = useTimelineStore((state) => state.pause);
  const setView = useTimelineStore((state) => state.setView);
  const rowFilter = useTimelineStore((state) => state.rowFilter);
  const collapsedGroups = useTimelineStore((state) => state.collapsedGroups);
  const mode = useTimelineStore((state) => state.mode);
  const videoTime = useTimelineStore((state) => state.videoTime);
  const inVideo = mode === "video";

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  const timeline = useMemo(
    () => getTimeline(paths, placedUnits),
    [paths, placedUnits]
  );
  const storyEnd = timeline.end;
  const current = currentMoment(now, storyStart);

  // The stretch of history on show: whatever you zoomed to, or the whole story. The fit
  // follows the saved dates only, so it holds still while a bar is being dragged.
  const fit = useMemo(
    () => fitView(storyStart, storyEnd),
    [storyStart, storyEnd]
  );
  const shown: HistoryView = view ?? fit;

  // One row per march; a bar being dragged shows its draft dates
  const rows: MarchRow[] = paths
    .filter((path) => timeline.timings.has(path.id))
    .map((path) => ({
      path,
      timing:
        draftTiming && draftTiming.pathId === path.id
          ? draftTiming.timing
          : timeline.timings.get(path.id)!,
    }));
  const hasMarches = rows.length > 0;

  // The rows, grouped by army and filtered. Headers only appear once some march belongs to
  // an army; until then it's a plain list.
  const groups = groupRows(
    rows,
    armies,
    rowFilter,
    current,
    shown,
    selectedPathId
  );
  const grouped = rows.some((row) => groupKeyOf(row.path, armies) !== NO_ARMY);
  const collapsed = new Set(collapsedGroups);
  const isOpen = (group: RowGroup) => !grouped || !collapsed.has(group.key);

  const selectedTiming = selectedPathId
    ? timeline.timings.get(selectedPathId)
    : undefined;
  const { rowRefs, headerRefs } = useSelectionReveal(
    selectedPathId,
    selectedTiming,
    selectedArmyId,
    storyStart,
    storyEnd
  );

  const { startResize, resetHeight, fittedHeight } = useRowsHeight();

  // A shot and a march are never both selected
  const selectedShot = shots.find((shot) => shot.id === selectedShotId);
  useEffect(() => {
    if (selectedPathId !== null) selectShot(null);
  }, [selectedPathId, selectShot]);

  // Keep track of the bar's width, for spacing the ruler's labels (on the next frame, for the
  // same reason as below)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setTrackWidth(track.clientWidth));
    });
    observer.observe(track);
    setTrackWidth(track.clientWidth);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [expanded, inVideo]);

  // Tell the map where the timeline's top edge is, so the video frame can sit above it. The
  // measuring waits for the next frame: changing the layout from inside a ResizeObserver
  // callback makes the browser report a "ResizeObserver loop" error.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const publish = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        useTimelineStore
          .getState()
          .setTimelineTop(Math.round(root.getBoundingClientRect().top))
      );
    };
    publish();
    window.addEventListener("resize", publish);
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(publish)
        : null;
    observer?.observe(root);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", publish);
      observer?.disconnect();
      useTimelineStore.getState().setTimelineTop(null);
    };
  }, []);

  // The rows (and so the bars to scroll and pinch) are only there outside video mode
  useTimelineWheel(trackRef, shown, expanded && !inVideo, setView);

  usePlayback(playing, storyStart, storyEnd, pause, mode, videoLength(shots));
  useVideoClock(mode, videoTime, shots, storyStart);

  // The stretch of history shaded on the rows: the selected shot's, or in video mode the
  // shot on screen
  const band =
    selectedShot ??
    (inVideo ? shotAt(shots, videoTime)?.shot : undefined) ??
    null;

  return (
    <div className={styles.timeline} ref={rootRef}>
      {expanded && !inVideo && (
        <div
          className={styles.resizeHandle}
          onMouseDown={startResize}
          onDoubleClick={resetHeight}
          title="Drag to give the marches more or less room (double-click for the usual height)"
        />
      )}
      <Transport
        current={current}
        hasMarches={hasMarches}
        storyEnd={storyEnd}
        firstMarch={timeline.start}
      />

      {expanded && <VideoStrip storyEnd={storyEnd} />}

      {/* Video mode is for arranging shots: the marches are tucked away */}
      {expanded && !inVideo && hasMarches && <MarchesHeader />}
      {expanded && !inVideo && (
        <TimelineRows
          groups={groups}
          grouped={grouped}
          isOpen={isOpen}
          shown={shown}
          current={current}
          hasMarches={hasMarches}
          height={fittedHeight}
          trackRef={trackRef}
          trackWidth={trackWidth}
          rowRefs={rowRefs}
          headerRefs={headerRefs}
          band={band}
        />
      )}
    </div>
  );
}

export default Timeline;
