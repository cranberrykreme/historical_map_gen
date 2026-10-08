import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import {
  currentMoment,
  useTimelineStore,
} from "../../store/useTimelineStore";
import { fitView, getTimeline, HistoryView } from "../../utils/timeline";
import {
  groupKeyOf,
  groupRows,
  MarchRow,
  NO_ARMY,
  RowGroup,
} from "../../utils/timelineRows";
import MarchEditor from "./MarchEditor";
import StoryStartEditor from "./StoryStartEditor";
import Transport from "./Transport";
import TimelineRows from "./TimelineRows";
import { usePlayback } from "./usePlayback";
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

  const now = useTimelineStore((state) => state.now);
  const playing = useTimelineStore((state) => state.playing);
  const expanded = useTimelineStore((state) => state.expanded);
  const draftTiming = useTimelineStore((state) => state.draftTiming);
  const view = useTimelineStore((state) => state.view);
  const pause = useTimelineStore((state) => state.pause);
  const setView = useTimelineStore((state) => state.setView);
  const rowFilter = useTimelineStore((state) => state.rowFilter);
  const collapsedGroups = useTimelineStore((state) => state.collapsedGroups);

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
  const selectedRow = rows.find((row) => row.path.id === selectedPathId);

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

  // Keep track of the bar's width, for spacing the ruler's labels
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(() => setTrackWidth(track.clientWidth));
    observer.observe(track);
    setTrackWidth(track.clientWidth);
    return () => observer.disconnect();
  }, [expanded]);

  useTimelineWheel(trackRef, shown, expanded, setView);

  usePlayback(playing, storyStart, storyEnd, pause);

  return (
    <div className={styles.timeline}>
      {expanded && (
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
      />

      {expanded &&
        (selectedRow ? (
          <MarchEditor
            path={selectedRow.path}
            timing={timeline.timings.get(selectedRow.path.id)!}
          />
        ) : (
          <StoryStartEditor firstMarch={timeline.start} />
        ))}

      {expanded && (
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
        />
      )}
    </div>
  );
}

export default Timeline;
