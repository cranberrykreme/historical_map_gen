import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "../store/useMapStore";
import { usePathToolStore } from "../store/usePathToolStore";
import { useTimelineStore } from "../store/useTimelineStore";
import {
  dragMarkerTime,
  dragTiming,
  formatTime,
  getTimeline,
  MovementTiming,
} from "../utils/timeline";
import {
  CalendarDate,
  clampDate,
  dateAtTime,
  formatDate,
  MONTH_NAMES,
} from "../utils/dates";
import { DateMarker, DateMode, MapPath } from "../types";
import styles from "./Timeline.module.css";

const MIN_VIEW = 10; // seconds shown at least
const VIEW_PADDING = 5; // seconds of room after the last movement or date
const SPEEDS = [0.5, 1, 2];
const START_TOLERANCE = 0.05; // a playhead this close to 0:00 counts as being at 0:00
const DATE_MODES: { mode: DateMode; label: string }[] = [
  { mode: "months", label: "Months" },
  { mode: "days", label: "Days" },
];

// The first date marker of a project, before there is anything to follow
const FIRST_DATE: CalendarDate = { year: 1066, month: 1, day: 1 };

type DragMode = "move" | "start" | "end";

const clock = (seconds: number) => formatTime(seconds).replace(/\.0$/, "");

function tickStepFor(view: number): number {
  if (view <= 30) return 5;
  if (view <= 120) return 10;
  return 30;
}

// The editor for the selected date marker. Typed numbers are applied when you leave the
// field or press Enter, so typing a year isn't a string of undo steps.
function DateMarkerEditor({ marker }: { marker: DateMarker }) {
  const updateDateMarker = useMapStore((state) => state.updateDateMarker);
  const deleteDateMarker = useMapStore((state) => state.deleteDateMarker);
  const selectMarker = useTimelineStore((state) => state.selectMarker);
  const [day, setDay] = useState<string>(String(marker.day));
  const [year, setYear] = useState<string>(String(marker.year));

  // Follow the marker when it changes elsewhere (undo, redo, or picking another marker)
  useEffect(() => {
    setDay(String(marker.day));
    setYear(String(marker.year));
  }, [marker.id, marker.day, marker.year]);

  const commit = (patch: Partial<CalendarDate>) => {
    const next = clampDate({
      year: marker.year,
      month: marker.month,
      day: marker.day,
      ...patch,
    });
    if (
      next.year !== marker.year ||
      next.month !== marker.month ||
      next.day !== marker.day
    ) {
      updateDateMarker(marker.id, patch);
    } else {
      setDay(String(marker.day));
      setYear(String(marker.year));
    }
  };

  const commitNumber = (text: string, field: "day" | "year") => {
    if (text.trim() === "" || !Number.isFinite(Number(text))) {
      setDay(String(marker.day));
      setYear(String(marker.year));
      return;
    }
    commit(field === "day" ? { day: Number(text) } : { year: Number(text) });
  };

  const applyOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  return (
    <div className={styles.editor}>
      <span>Date at {formatTime(marker.time)}</span>
      <input
        type="number"
        className={styles.editorInput}
        min={1}
        max={31}
        value={day}
        title="Day"
        onChange={(e) => setDay(e.target.value)}
        onBlur={() => commitNumber(day, "day")}
        onKeyDown={applyOnEnter}
      />
      <select
        className={styles.editorSelect}
        value={marker.month}
        title="Month"
        onChange={(e) => commit({ month: Number(e.target.value) })}
      >
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </select>
      <input
        type="number"
        className={`${styles.editorInput} ${styles.editorInputYear}`}
        min={1}
        max={9999}
        value={year}
        title="Year"
        onChange={(e) => setYear(e.target.value)}
        onBlur={() => commitNumber(year, "year")}
        onKeyDown={applyOnEnter}
      />
      <button
        className={styles.editorDelete}
        onClick={() => {
          deleteDateMarker(marker.id);
          selectMarker(null);
        }}
      >
        Delete
      </button>
    </div>
  );
}

function Timeline() {
  const paths = useMapStore((state) => state.paths);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const selectPath = useMapStore((state) => state.selectPath);
  const setPathTiming = useMapStore((state) => state.setPathTiming);
  const dateMarkers = useMapStore((state) => state.dateMarkers);
  const dateMode = useMapStore((state) => state.dateMode);
  const setDateMode = useMapStore((state) => state.setDateMode);
  const addDateMarker = useMapStore((state) => state.addDateMarker);
  const updateDateMarker = useMapStore((state) => state.updateDateMarker);

  const time = useTimelineStore((state) => state.time);
  const playing = useTimelineStore((state) => state.playing);
  const speed = useTimelineStore((state) => state.speed);
  const expanded = useTimelineStore((state) => state.expanded);
  const draftTiming = useTimelineStore((state) => state.draftTiming);
  const selectedMarkerId = useTimelineStore((state) => state.selectedMarkerId);
  const setTime = useTimelineStore((state) => state.setTime);
  const play = useTimelineStore((state) => state.play);
  const pause = useTimelineStore((state) => state.pause);
  const setSpeed = useTimelineStore((state) => state.setSpeed);
  const setExpanded = useTimelineStore((state) => state.setExpanded);
  const setDraftTiming = useTimelineStore((state) => state.setDraftTiming);
  const selectMarker = useTimelineStore((state) => state.selectMarker);

  const [draftMarker, setDraftMarker] = useState<{
    id: string;
    time: number;
  } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const timeline = useMemo(
    () => getTimeline(paths, placedUnits),
    [paths, placedUnits]
  );
  const duration = timeline.duration;

  // How much time the bar shows. It follows the saved timings and dates only, so it holds
  // still while a bar or marker is being dragged.
  const latestMarker = dateMarkers.reduce(
    (latest, m) => Math.max(latest, m.time),
    0
  );
  const view = Math.max(
    MIN_VIEW,
    Math.ceil((Math.max(duration, latestMarker) + VIEW_PADDING) / 5) * 5
  );

  // One row per movement; a bar being dragged shows its draft timing
  const rows = paths
    .filter((path) => timeline.timings.has(path.id))
    .map((path) => ({
      path,
      timing:
        draftTiming && draftTiming.pathId === path.id
          ? draftTiming.timing
          : timeline.timings.get(path.id)!,
    }));
  const hasMovements = rows.length > 0;

  const markerTime = (marker: DateMarker) =>
    draftMarker && draftMarker.id === marker.id
      ? draftMarker.time
      : marker.time;
  const selectedMarker = dateMarkers.find(
    (marker) => marker.id === selectedMarkerId
  );

  const ticks: number[] = [];
  for (let t = 0; t <= view; t += tickStepFor(view)) ticks.push(t);

  // Play: advance the playhead in real time until the last movement has finished
  useEffect(() => {
    if (!playing) return;
    if (duration <= 0) {
      pause();
      return;
    }
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = Math.min(Math.max((now - last) / 1000, 0), 0.1);
      last = now;
      const state = useTimelineStore.getState();
      const next = state.time + elapsed * state.speed;
      if (next >= duration) {
        state.setTime(duration);
        state.pause();
        return;
      }
      state.setTime(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration, pause]);

  const handlePlay = () => {
    if (playing) {
      pause();
      return;
    }
    usePathToolStore.getState().clearPreview(); // the timeline and a path preview never both play
    if (time >= duration - START_TOLERANCE) setTime(0);
    play();
  };

  const handleRewind = () => {
    pause();
    setTime(0);
  };

  const timeFromPointer = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    const t = Math.min(
      Math.max(((clientX - rect.left) / rect.width) * view, 0),
      view
    );
    return t < START_TOLERANCE ? 0 : t;
  };

  // Clicking or dragging on the ruler or an empty part of a row moves the playhead
  const startScrub = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    usePathToolStore.getState().clearPreview();
    selectMarker(null);
    pause();
    setTime(timeFromPointer(e.clientX));

    const onMove = (ev: MouseEvent) => setTime(timeFromPointer(ev.clientX));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Dragging a bar moves it; dragging its ends changes how long the march takes
  const startBarDrag = (
    e: React.MouseEvent,
    path: MapPath,
    timing: MovementTiming,
    mode: DragMode
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // not a playhead scrub
    e.preventDefault();
    selectPath(path.id);

    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const secondsPerPixel = view / rect.width;
    const startX = e.clientX;
    let latest = timing;

    const onMove = (ev: MouseEvent) => {
      latest = dragTiming(
        timing,
        (ev.clientX - startX) * secondsPerPixel,
        mode,
        view
      );
      setDraftTiming({ pathId: path.id, timing: latest });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setDraftTiming(null);
      if (latest.start !== timing.start || latest.end !== timing.end) {
        setPathTiming(path.id, latest.start, latest.end);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Dragging a date marker moves it along the timeline
  const startMarkerDrag = (e: React.MouseEvent, marker: DateMarker) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // not a playhead scrub
    e.preventDefault();
    selectMarker(marker.id);

    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const secondsPerPixel = view / rect.width;
    const startX = e.clientX;
    let latest = marker.time;

    const onMove = (ev: MouseEvent) => {
      latest = dragMarkerTime(
        marker.time,
        (ev.clientX - startX) * secondsPerPixel,
        view
      );
      setDraftMarker({ id: marker.id, time: latest });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setDraftMarker(null);
      if (latest !== marker.time) updateDateMarker(marker.id, { time: latest });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Double-clicking the dates row adds a marker at that moment, with the date the timeline
  // has reached there
  const handleDateRowDoubleClick = (e: React.MouseEvent) => {
    const t = Math.round(timeFromPointer(e.clientX) * 10) / 10;
    const date = dateAtTime(dateMarkers, t) ?? FIRST_DATE;
    selectMarker(addDateMarker(t, date));
  };

  return (
    <div className={styles.timeline}>
      <div className={styles.transport}>
        <button
          className={styles.iconButton}
          onClick={handleRewind}
          title="Back to the start (units can be edited at 0:00)"
        >
          {"\u23EE\uFE0E"}
        </button>
        <button
          className={styles.playButton}
          onClick={handlePlay}
          disabled={!hasMovements}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? "\u275A\u275A" : "\u25B6\uFE0E"}
        </button>
        <span className={styles.time}>
          {formatTime(time)}
          <span className={styles.timeTotal}> / {formatTime(duration)}</span>
        </span>
        <div className={styles.speed}>
          {SPEEDS.map((value) => (
            <button
              key={value}
              className={`${styles.speedButton} ${speed === value ? styles.speedActive : ""}`}
              onClick={() => setSpeed(value)}
            >
              {value}×
            </button>
          ))}
        </div>
        <span className={styles.modeLabel}>Dates</span>
        <div className={styles.speed} title="How the date is shown on screen">
          {DATE_MODES.map(({ mode, label }) => (
            <button
              key={mode}
              className={`${styles.speedButton} ${dateMode === mode ? styles.speedActive : ""}`}
              onClick={() => setDateMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>
        {time > 0 && !playing && (
          <span className={styles.note}>
            Units are locked while the playhead is away from 0:00
          </span>
        )}
        <div className={styles.spacer} />
        <button
          className={styles.iconButton}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Collapse the timeline" : "Expand the timeline"}
        >
          {expanded ? "\u25BE" : "\u25B4"}
        </button>
      </div>

      {expanded && selectedMarker && (
        <DateMarkerEditor marker={selectedMarker} />
      )}

      {expanded && (
        <div className={styles.body}>
          <div className={styles.labels}>
            <div className={styles.labelSpacer} />
            <div className={`${styles.label} ${styles.labelStatic}`}>Dates</div>
            {rows.map(({ path }) => (
              <div
                key={path.id}
                className={`${styles.label} ${
                  path.id === selectedPathId ? styles.labelActive : ""
                }`}
                title={path.name}
                onClick={() =>
                  selectPath(path.id === selectedPathId ? null : path.id)
                }
              >
                {path.name}
              </div>
            ))}
          </div>

          <div
            className={styles.tracks}
            ref={trackRef}
            onMouseDown={startScrub}
          >
            <div className={styles.ruler}>
              {ticks.map((t) => (
                <div
                  key={t}
                  className={styles.tick}
                  style={{ left: `${(t / view) * 100}%` }}
                >
                  <span className={styles.tickLabel}>{clock(t)}</span>
                </div>
              ))}
            </div>

            <div
              className={styles.dateRow}
              title="Double-click to add a date"
              onDoubleClick={handleDateRowDoubleClick}
            >
              {dateMarkers.map((marker) => {
                const selected = marker.id === selectedMarkerId;
                return (
                  <div
                    key={marker.id}
                    className={styles.dateMarker}
                    style={{
                      left: `${(Math.min(markerTime(marker), view) / view) * 100}%`,
                    }}
                    title={formatDate(marker, "days")}
                    onMouseDown={(e) => startMarkerDrag(e, marker)}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className={`${styles.diamond} ${selected ? styles.diamondSelected : ""}`}
                    />
                    {selected && (
                      <span className={styles.dateMarkerLabel}>
                        {formatDate(marker, dateMode)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {rows.map(({ path, timing }) => (
              <div key={path.id} className={styles.row}>
                <div
                  className={`${styles.bar} ${
                    path.id === selectedPathId ? styles.barActive : ""
                  }`}
                  style={{
                    left: `${(timing.start / view) * 100}%`,
                    width: `${((timing.end - timing.start) / view) * 100}%`,
                  }}
                  title={`${clock(timing.start)} to ${clock(timing.end)}`}
                  onMouseDown={(e) => startBarDrag(e, path, timing, "move")}
                >
                  <div
                    className={`${styles.handle} ${styles.handleStart}`}
                    onMouseDown={(e) => startBarDrag(e, path, timing, "start")}
                  />
                  <div
                    className={`${styles.handle} ${styles.handleEnd}`}
                    onMouseDown={(e) => startBarDrag(e, path, timing, "end")}
                  />
                </div>
              </div>
            ))}

            {!hasMovements && (
              <div className={styles.empty}>
                Attach units to a path and its march appears here.
              </div>
            )}

            <div
              className={styles.playhead}
              style={{ left: `${(Math.min(time, view) / view) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Timeline;
