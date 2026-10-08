import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "../store/useMapStore";
import { usePathToolStore } from "../store/usePathToolStore";
import {
  clampRowsHeight,
  currentMoment,
  DEFAULT_ROWS_HEIGHT,
  isPastStart,
  useTimelineStore,
} from "../store/useTimelineStore";
import {
  barPlacement,
  fitView,
  getTimeline,
  HistoryView,
  keepAfter,
  snapStepFor,
  viewShowing,
  zoomView,
} from "../utils/timeline";
import { dragMarch, MarchDragMode } from "../utils/marches";
import {
  formatDuration,
  formatHistoryTime,
  historyTicks,
  HistoryTime,
  HOUR,
} from "../utils/historyTime";
import {
  allowedStoryStart,
  durationFields,
  fromDurationFields,
  fromMomentFields,
  momentFields,
  MomentFields,
  DurationFields,
} from "../utils/historyEdit";
import { MONTH_NAMES } from "../utils/dates";
import {
  groupKeyOf,
  groupRows,
  MarchRow,
  NO_ARMY,
  RowFilter,
  RowGroup,
} from "../utils/timelineRows";
import { HistoryDisplay, MapPath, MarchTiming } from "../types";
import styles from "./Timeline.module.css";

// How much history plays per second of preview
const PACES: { days: number; label: string }[] = [
  { days: HOUR, label: "1 hr" },
  { days: 6 * HOUR, label: "6 hr" },
  { days: 1, label: "1 day" },
  { days: 7, label: "1 wk" },
  { days: 365.2425 / 12, label: "1 mo" },
  { days: 365.2425, label: "1 yr" },
];

const DISPLAYS: { mode: HistoryDisplay; label: string }[] = [
  { mode: "months", label: "Months" },
  { mode: "days", label: "Days" },
  { mode: "times", label: "Times" },
];

const FILTERS: { filter: RowFilter; label: string; hint: string }[] = [
  { filter: "all", label: "All", hint: "List every march" },
  {
    filter: "now",
    label: "Now",
    hint: "List only the marches under way at the playhead",
  },
  {
    filter: "view",
    label: "In view",
    hint: "List the marches in the stretch of history on show",
  },
];

const TICK_SPACING = 90; // pixels between ruler labels, at least
const START_SNAP = 4; // pixels: a playhead this close to the story's start counts as at it
const ZOOM_SPEED = 0.01; // per unit of pinch or ⌘-scroll

const pad2 = (n: number) => String(n).padStart(2, "0");

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

const MIN_BAR_PX = 6; // a very short march still gets a bar you can see and grab

// A number box that applies what you typed when you leave it or press Enter, so typing a
// year isn't a string of undo steps. Anything that isn't a number puts the old value back.
function NumberField({
  value,
  min,
  max,
  width,
  title,
  padded,
  onCommit,
}: {
  value: number;
  min: number;
  max?: number;
  width: number;
  title: string;
  padded?: boolean;
  onCommit: (value: number) => void;
}) {
  const shown = padded ? pad2(value) : String(value);
  const [draft, setDraft] = useState(shown);

  // Follow the value when it changes elsewhere (undo, dragging the bar, another field)
  useEffect(() => setDraft(shown), [shown]);

  const finish = () => {
    const typed = Number(draft);
    setDraft(shown);
    if (draft.trim() === "" || !Number.isFinite(typed) || typed === value)
      return;
    onCommit(typed);
  };

  return (
    <input
      type="number"
      className={styles.editorInput}
      style={{ width }}
      min={min}
      max={max}
      value={draft}
      title={title}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={finish}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

// A moment in history as day, month, year and time of day
function MomentInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: HistoryTime;
  onCommit: (t: HistoryTime) => void;
}) {
  const fields = momentFields(value);
  const change = (patch: Partial<MomentFields>) => {
    const next = fromMomentFields({ ...fields, ...patch });
    if (next !== value) onCommit(next);
  };

  return (
    <span className={styles.field}>
      <span className={styles.editorLabel}>{label}</span>
      <NumberField
        value={fields.day}
        min={1}
        max={31}
        width={44}
        title="Day"
        onCommit={(day) => change({ day })}
      />
      <select
        className={styles.editorSelect}
        value={fields.month}
        title="Month"
        onChange={(e) => change({ month: Number(e.target.value) })}
      >
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </select>
      <NumberField
        value={fields.year}
        min={1}
        max={9999}
        width={64}
        title="Year"
        onCommit={(year) => change({ year })}
      />
      <NumberField
        value={fields.hour}
        min={0}
        max={23}
        width={42}
        title="Hour (0 to 23)"
        padded
        onCommit={(hour) => change({ hour })}
      />
      <span className={styles.editorDim}>:</span>
      <NumberField
        value={fields.minute}
        min={0}
        max={59}
        width={42}
        title="Minute"
        padded
        onCommit={(minute) => change({ minute })}
      />
    </span>
  );
}

// A length of history as days, hours and minutes
function DurationInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (days: number) => void;
}) {
  const fields = durationFields(value);
  const change = (patch: Partial<DurationFields>) => {
    const next = fromDurationFields({ ...fields, ...patch });
    if (next !== value) onCommit(next);
  };

  return (
    <span className={styles.field}>
      <span className={styles.editorLabel}>{label}</span>
      <NumberField
        value={fields.days}
        min={0}
        width={52}
        title="Days"
        onCommit={(days) => change({ days })}
      />
      <span className={styles.editorDim}>d</span>
      <NumberField
        value={fields.hours}
        min={0}
        width={42}
        title="Hours"
        onCommit={(hours) => change({ hours })}
      />
      <span className={styles.editorDim}>h</span>
      <NumberField
        value={fields.minutes}
        min={0}
        width={42}
        title="Minutes"
        onCommit={(minutes) => change({ minutes })}
      />
      <span className={styles.editorDim}>m</span>
    </span>
  );
}

// Exact dates for the selected march. Each change is one undo step.
function MarchEditor({ path, timing }: { path: MapPath; timing: MarchTiming }) {
  const setMarchTiming = useMapStore((state) => state.setMarchTiming);
  const marching = timing.end - timing.start - timing.turn;

  return (
    <div className={styles.editor}>
      <span className={styles.editorTitle} title={path.name}>
        {path.name}
      </span>
      <MomentInput
        label="Starts"
        value={timing.start}
        onCommit={(start) => setMarchTiming(path.id, { ...timing, start })}
      />
      <MomentInput
        label="Ends"
        value={timing.end}
        onCommit={(end) => setMarchTiming(path.id, { ...timing, end })}
      />
      <DurationInput
        label="Turning"
        value={timing.turn}
        onCommit={(turn) => setMarchTiming(path.id, { ...timing, turn })}
      />
      <span className={styles.editorDim}>
        Marching: {formatDuration(marching)}
      </span>
    </div>
  );
}

// When the story begins. It can't be later than the first march.
function StoryStartEditor({ firstMarch }: { firstMarch: HistoryTime | null }) {
  const storyStart = useMapStore((state) => state.storyStart);
  const setStoryStart = useMapStore((state) => state.setStoryStart);

  const commit = (wanted: HistoryTime) => {
    const next = allowedStoryStart(wanted, firstMarch);
    setStoryStart(next);
    // A playhead at or before the new start is at the start
    const timeline = useTimelineStore.getState();
    if (timeline.now !== null && timeline.now <= next) timeline.setNow(null);
  };

  return (
    <div className={styles.editor}>
      <MomentInput label="Story starts" value={storyStart} onCommit={commit} />
      <span className={styles.editorDim}>
        {firstMarch !== null
          ? `No later than the first march (${formatHistoryTime(firstMarch, "times")})`
          : "Select a march to edit its dates"}
      </span>
    </div>
  );
}

function Timeline() {
  const paths = useMapStore((state) => state.paths);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const selectPath = useMapStore((state) => state.selectPath);
  const setMarchTiming = useMapStore((state) => state.setMarchTiming);
  const storyStart = useMapStore((state) => state.storyStart);
  const displayMode = useMapStore((state) => state.displayMode);
  const setDisplayMode = useMapStore((state) => state.setDisplayMode);
  const armies = useMapStore((state) => state.armies);
  const selectedArmyId = useMapStore((state) => state.selectedArmyId);
  const selectArmy = useMapStore((state) => state.selectArmy);

  const now = useTimelineStore((state) => state.now);
  const playing = useTimelineStore((state) => state.playing);
  const pace = useTimelineStore((state) => state.pace);
  const expanded = useTimelineStore((state) => state.expanded);
  const draftTiming = useTimelineStore((state) => state.draftTiming);
  const view = useTimelineStore((state) => state.view);
  const setNow = useTimelineStore((state) => state.setNow);
  const play = useTimelineStore((state) => state.play);
  const pause = useTimelineStore((state) => state.pause);
  const setPace = useTimelineStore((state) => state.setPace);
  const setExpanded = useTimelineStore((state) => state.setExpanded);
  const setDraftTiming = useTimelineStore((state) => state.setDraftTiming);
  const setView = useTimelineStore((state) => state.setView);
  const rowFilter = useTimelineStore((state) => state.rowFilter);
  const setRowFilter = useTimelineStore((state) => state.setRowFilter);
  const collapsedGroups = useTimelineStore((state) => state.collapsedGroups);
  const toggleGroup = useTimelineStore((state) => state.toggleGroup);
  const rowsHeight = useTimelineStore((state) => state.rowsHeight);

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
  const span = shown.to - shown.from;
  const percent = (t: HistoryTime) => ((t - shown.from) / span) * 100;

  // The wheel handler is attached once, so it reads the latest view through a ref
  const shownRef = useRef(shown);
  shownRef.current = shown;

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

  // Selecting a march (here, on the map or in a panel) brings its bar into view, opens its
  // group and scrolls its row into sight
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const headerRefs = useRef(new Map<string, HTMLDivElement>());
  const selectedTiming = selectedPathId
    ? timeline.timings.get(selectedPathId)
    : undefined;
  useEffect(() => {
    if (!selectedPathId || !selectedTiming) return;
    const state = useTimelineStore.getState();
    const visible = state.view ?? fitView(storyStart, storyEnd);
    if (barPlacement(selectedTiming, visible) !== "inside") {
      state.setView(viewShowing(selectedTiming, visible));
    }
    const path = useMapStore
      .getState()
      .paths.find((p) => p.id === selectedPathId);
    if (path)
      state.expandGroup(groupKeyOf(path, useMapStore.getState().armies));
    // After the group has opened
    const frame = requestAnimationFrame(() =>
      rowRefs.current.get(selectedPathId)?.scrollIntoView({ block: "nearest" })
    );
    return () => cancelAnimationFrame(frame);
    // Only when the selection changes, not on every edit of the selected march
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPathId]);

  // Selecting an army (in the Armies tab, say) opens its group and scrolls to it
  useEffect(() => {
    if (!selectedArmyId) return;
    useTimelineStore.getState().expandGroup(selectedArmyId);
    const frame = requestAnimationFrame(() =>
      headerRefs.current
        .get(selectedArmyId)
        ?.scrollIntoView({ block: "nearest" })
    );
    return () => cancelAnimationFrame(frame);
  }, [selectedArmyId]);

  // Drag the timeline's top edge to give the rows more or less room; double-click it to go
  // back to the usual height
  const startResize = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = useTimelineStore.getState().rowsHeight;
    const onMove = (ev: MouseEvent) =>
      useTimelineStore
        .getState()
        .setRowsHeight(
          clampRowsHeight(
            startHeight + (startY - ev.clientY),
            window.innerHeight
          )
        );
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      useTimelineStore.getState().saveRowsHeight();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const resetHeight = () => {
    const state = useTimelineStore.getState();
    state.setRowsHeight(
      clampRowsHeight(DEFAULT_ROWS_HEIGHT, window.innerHeight)
    );
    state.saveRowsHeight();
  };

  // Keep within the window as it is resized. (The panel as a whole is also capped to the
  // window's height in the CSS, so the rows give way first on a very small window.)
  const [windowHeight, setWindowHeight] = useState(() =>
    typeof window === "undefined" ? Infinity : window.innerHeight
  );
  useEffect(() => {
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const fittedHeight = clampRowsHeight(rowsHeight, windowHeight);

  const reveal = (e: React.MouseEvent, path: MapPath, timing: MarchTiming) => {
    e.stopPropagation(); // not a playhead scrub
    e.preventDefault();
    selectPath(path.id);
    setView(viewShowing(timing, shown));
  };

  const ticks = historyTicks(
    shown.from,
    shown.to,
    Math.max(Math.floor(trackWidth / TICK_SPACING), 2)
  );

  // Keep track of the bar's width, for spacing the ruler's labels
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(() => setTrackWidth(track.clientWidth));
    observer.observe(track);
    setTrackWidth(track.clientWidth);
    return () => observer.disconnect();
  }, [expanded]);

  // Pinching on a trackpad (or ⌘/Ctrl-scrolling) zooms about the pointer, and swiping
  // sideways (or Shift-scrolling) pans. Plain scrolling is left alone, so it scrolls the
  // rows. Attached by hand because React's wheel events can't stop the page from zooming.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const handleWheel = (e: WheelEvent) => {
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) return;
      const base = shownRef.current;
      const baseSpan = base.to - base.from;

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const anchor =
          base.from + ((e.clientX - rect.left) / rect.width) * baseSpan;
        setView(zoomView(base, anchor, Math.exp(e.deltaY * ZOOM_SPEED)));
        return;
      }

      const sideways = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (sideways) {
        e.preventDefault();
        const pixels = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        const shift = (pixels / rect.width) * baseSpan;
        setView({ from: base.from + shift, to: base.to + shift });
      }
    };
    track.addEventListener("wheel", handleWheel, { passive: false });
    return () => track.removeEventListener("wheel", handleWheel);
  }, [expanded, setView]);

  // Play: move through history at the chosen pace until the last march has finished
  useEffect(() => {
    if (!playing) return;
    if (storyEnd === null || storyEnd <= storyStart) {
      pause();
      return;
    }
    let last = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const elapsed = Math.min(Math.max((time - last) / 1000, 0), 0.1);
      last = time;
      const state = useTimelineStore.getState();
      const next = currentMoment(state.now, storyStart) + elapsed * state.pace;
      if (next >= storyEnd) {
        state.setNow(storyEnd);
        state.pause();
        return;
      }
      state.setNow(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, storyStart, storyEnd, pause]);

  const handlePlay = () => {
    if (playing) {
      pause();
      return;
    }
    usePathToolStore.getState().clearPreview(); // the timeline and a path preview never both play
    if (storyEnd !== null && current >= storyEnd - 1e-9) setNow(null);
    play();
  };

  const handleRewind = () => {
    pause();
    setNow(null);
  };

  // The moment under the pointer. Never before the story starts, and close enough to the
  // start counts as at it (null), where units can be edited.
  const momentAt = (clientX: number): HistoryTime | null => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const t = shown.from + ((clientX - rect.left) / rect.width) * span;
    const startX = rect.left + (percent(storyStart) / 100) * rect.width;
    return t <= storyStart || clientX - startX < START_SNAP ? null : t;
  };

  // Clicking or dragging on the ruler or an empty part of a row moves the playhead
  const startScrub = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    usePathToolStore.getState().clearPreview();
    pause();
    setNow(momentAt(e.clientX));

    const onMove = (ev: MouseEvent) => setNow(momentAt(ev.clientX));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Dragging a bar moves the march; its ends change its dates; the line between the turn
  // and the march changes how long the turn takes
  const startBarDrag = (
    e: React.MouseEvent,
    path: MapPath,
    timing: MarchTiming,
    mode: MarchDragMode
  ) => {
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

  const describe = (timing: MarchTiming) =>
    [
      `${formatHistoryTime(timing.start, "times")} to ${formatHistoryTime(timing.end, "times")}`,
      `Turning: ${formatDuration(timing.turn)}`,
      `Marching: ${formatDuration(timing.end - timing.start - timing.turn)}`,
    ].join("\n");

  const startShare = percent(storyStart);

  const emptyMessage =
    rowFilter === "now"
      ? `No marches under way on ${formatHistoryTime(current, "days")}`
      : "No marches in this stretch of history. Pan or zoom out, or click Fit.";

  const groupTitle = (group: RowGroup) => {
    const count =
      rowFilter === "all" || group.rows.length === group.total
        ? `${group.total} march${group.total === 1 ? "" : "es"}`
        : `${group.rows.length} of ${group.total} marches listed`;
    return `${group.army ? group.army.name : "Marches in no army"}\n${count}\n${formatHistoryTime(
      group.start,
      "times"
    )} to ${formatHistoryTime(group.end, "times")}`;
  };

  // The rows a group shows: none while it's folded away
  const shownRows = (group: RowGroup) => (isOpen(group) ? group.rows : []);

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
      <div className={styles.transport}>
        <button
          className={styles.iconButton}
          onClick={handleRewind}
          title="Back to the start of the story (units can be edited there)"
        >
          {"⏮︎"}
        </button>
        <button
          className={styles.playButton}
          onClick={handlePlay}
          disabled={!hasMarches}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? "❚❚" : "▶︎"}
        </button>
        <span className={styles.time}>
          {formatHistoryTime(current, "times")}
        </span>
        <span className={styles.modeLabel}>Per second</span>
        <div className={styles.speed}>
          {PACES.map(({ days, label }) => (
            <button
              key={label}
              className={`${styles.speedButton} ${pace === days ? styles.speedActive : ""}`}
              onClick={() => setPace(days)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={styles.modeLabel}>Date</span>
        <div className={styles.speed} title="How the date is shown on screen">
          {DISPLAYS.map(({ mode, label }) => (
            <button
              key={mode}
              className={`${styles.speedButton} ${displayMode === mode ? styles.speedActive : ""}`}
              onClick={() => setDisplayMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className={styles.textButton}
          onClick={() => setView(null)}
          disabled={view === null}
          title="Show the whole story (pinch or ⌘-scroll on the bars to zoom, swipe sideways or Shift-scroll to pan)"
        >
          Fit
        </button>
        <span className={styles.modeLabel}>Show</span>
        <div className={styles.speed} title="Which marches are listed">
          {FILTERS.map(({ filter, label, hint }) => (
            <button
              key={filter}
              title={hint}
              className={`${styles.speedButton} ${rowFilter === filter ? styles.speedActive : ""}`}
              onClick={() => setRowFilter(filter)}
            >
              {label}
            </button>
          ))}
        </div>
        {isPastStart(now, storyStart) && !playing && (
          <span className={styles.note}>
            Units can only be moved at the moment they appear
          </span>
        )}
        <div className={styles.spacer} />
        <button
          className={styles.iconButton}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Collapse the timeline" : "Expand the timeline"}
        >
          {expanded ? "▾" : "▴"}
        </button>
      </div>

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
        <div className={styles.body} style={{ maxHeight: fittedHeight }}>
          <div className={styles.labels}>
            <div className={styles.labelSpacer} />
            {groups.map((group) => (
              <React.Fragment key={group.key}>
                {grouped && (
                  <div
                    ref={(el) => {
                      if (el) headerRefs.current.set(group.key, el);
                      else headerRefs.current.delete(group.key);
                    }}
                    className={`${styles.groupLabel} ${
                      group.army && group.army.id === selectedArmyId
                        ? styles.labelActive
                        : ""
                    }`}
                    title={groupTitle(group)}
                  >
                    <button
                      className={styles.groupToggle}
                      onClick={() => toggleGroup(group.key)}
                      title={
                        isOpen(group)
                          ? "Fold these marches away"
                          : "Show these marches"
                      }
                    >
                      {isOpen(group) ? "▾" : "▸"}
                    </button>
                    <span
                      className={styles.groupName}
                      onClick={() =>
                        group.army
                          ? selectArmy(
                              group.army.id === selectedArmyId
                                ? null
                                : group.army.id
                            )
                          : toggleGroup(group.key)
                      }
                    >
                      {group.army ? group.army.name : "No army"}
                    </span>
                    <span className={styles.groupCount}>
                      {rowFilter === "all" || group.rows.length === group.total
                        ? group.total
                        : `${group.rows.length}/${group.total}`}
                    </span>
                  </div>
                )}
                {shownRows(group).map(({ path, timing }) => (
                  <div
                    key={path.id}
                    ref={(el) => {
                      if (el) rowRefs.current.set(path.id, el);
                      else rowRefs.current.delete(path.id);
                    }}
                    className={`${styles.label} ${grouped ? styles.labelIndented : ""} ${
                      path.id === selectedPathId ? styles.labelActive : ""
                    }`}
                    title={`${path.name}\n${describe(timing)}`}
                    onClick={() =>
                      selectPath(path.id === selectedPathId ? null : path.id)
                    }
                  >
                    {path.name}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          <div
            className={styles.tracks}
            ref={trackRef}
            onMouseDown={startScrub}
          >
            {startShare > 0 && (
              <div
                className={styles.beforeStart}
                style={{ width: `${Math.min(startShare, 100)}%` }}
                title="Before the story starts"
              />
            )}

            <div className={styles.ruler}>
              {ticks.map((tick) => (
                <div
                  key={tick.time}
                  className={styles.tick}
                  style={{ left: `${percent(tick.time)}%` }}
                >
                  <span className={styles.tickLabel}>{tick.label}</span>
                </div>
              ))}
            </div>

            {groups.map((group) => (
              <React.Fragment key={group.key}>
                {grouped && (
                  <div className={styles.groupRow} title={groupTitle(group)}>
                    {group.end >= shown.from && group.start <= shown.to && (
                      <div
                        className={`${styles.groupBar} ${
                          group.army && group.army.id === selectedArmyId
                            ? styles.groupBarActive
                            : ""
                        }`}
                        style={{
                          left: `${Math.max(percent(group.start), 0)}%`,
                          right: `${Math.max(100 - percent(group.end), 0)}%`,
                          minWidth: MIN_BAR_PX,
                        }}
                      />
                    )}
                  </div>
                )}
                {shownRows(group).map(({ path, timing }) => {
                  const length = timing.end - timing.start;
                  const turnShare =
                    length > 0 ? (timing.turn / length) * 100 : 0;
                  const active = path.id === selectedPathId;
                  const placement = barPlacement(timing, shown);
                  return (
                    <div key={path.id} className={styles.row}>
                      {placement === "before" && (
                        <div
                          style={{ ...OFFSCREEN, left: 2 }}
                          title={`Earlier: ${describe(timing)}\nClick to show it`}
                          onMouseDown={(e) => reveal(e, path, timing)}
                        >
                          {"◂"}
                        </div>
                      )}
                      {placement === "after" && (
                        <div
                          style={{ ...OFFSCREEN, right: 2 }}
                          title={`Later: ${describe(timing)}\nClick to show it`}
                          onMouseDown={(e) => reveal(e, path, timing)}
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
                        onMouseDown={(e) =>
                          startBarDrag(e, path, timing, "move")
                        }
                      >
                        <div
                          className={styles.barTurn}
                          style={{ width: `${turnShare}%` }}
                        />
                        <div
                          className={styles.barMarch}
                          style={{ left: `${turnShare}%` }}
                        />
                        <div
                          className={styles.splitHandle}
                          style={{ left: `${turnShare}%` }}
                          title="Drag to change how long the turn takes"
                          onMouseDown={(e) =>
                            startBarDrag(e, path, timing, "split")
                          }
                        />
                        <div
                          className={`${styles.handle} ${styles.handleStart}`}
                          onMouseDown={(e) =>
                            startBarDrag(e, path, timing, "start")
                          }
                        />
                        <div
                          className={`${styles.handle} ${styles.handleEnd}`}
                          onMouseDown={(e) =>
                            startBarDrag(e, path, timing, "end")
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            {!hasMarches && (
              <div className={styles.empty}>
                Attach units to a path and its march appears here.
              </div>
            )}
            {hasMarches && groups.length === 0 && (
              <div className={styles.empty}>{emptyMessage}</div>
            )}

            {current >= shown.from && current <= shown.to && (
              <div
                className={styles.playhead}
                style={{ left: `${percent(current)}%` }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Timeline;
