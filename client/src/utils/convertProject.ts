import {
  DateMarker,
  HistoryDisplay,
  MapPath,
  MarchTiming,
  PacingKey,
  SavedViewport,
  Unit,
} from "../types";
import { clampDate, daysFromCivil } from "./dates";
import { HistoryTime, toHistoryTime } from "./historyTime";
import { clampMarch } from "./marches";
import { createPlayback } from "./pathPlayback";

// Where a new project's story starts
export const DEFAULT_STORY_START = toHistoryTime({
  year: 1066,
  month: 1,
  day: 1,
});

// How version 1 projects timed a march with no end set: 100 map units per second, to the
// nearest tenth of a second, and never under half a second
const LEGACY_PACE = 100;
const LEGACY_MIN_SECONDS = 0.5;

export interface LoadedProject {
  units: Unit[];
  paths: MapPath[];
  storyStart: HistoryTime;
  displayMode: HistoryDisplay;
  pacing: PacingKey[];
  selectedMapFilename: string | null;
  viewport: SavedViewport | null;
}

export function emptyProject(): LoadedProject {
  return {
    units: [],
    paths: [],
    storyStart: DEFAULT_STORY_START,
    displayMode: "months",
    pacing: [],
    selectedMapFilename: null,
    viewport: null,
  };
}

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const DISPLAYS: HistoryDisplay[] = ["months", "days", "times"];

// ---- Version 1: seconds on the video, with date markers ----

// The date markers of a version 1 project as pairs of seconds and history, in order. Two
// markers at the same second keep the first.
export function pacingFromMarkers(markers: DateMarker[]): PacingKey[] {
  const keys: PacingKey[] = [];
  [...markers]
    .sort((a, b) => a.time - b.time)
    .forEach((m) => {
      if (keys.length > 0 && keys[keys.length - 1].seconds === m.time) return;
      keys.push({ seconds: m.time, time: daysFromCivil(clampDate(m)) });
    });
  return keys;
}

// Turns seconds on a version 1 video timeline into history. Between markers it runs straight
// from one marker's date to the next. Beyond the first and last it carries on at the pace of
// the nearest stretch. With one marker, or none, a second is a day (from 1 January 1066 when
// there are none).
export function legacyClock(
  keys: PacingKey[]
): (seconds: number) => HistoryTime {
  if (keys.length === 0) return (seconds) => DEFAULT_STORY_START + seconds;
  if (keys.length === 1)
    return (seconds) => keys[0].time + (seconds - keys[0].seconds);

  return (seconds) => {
    let i = 0;
    while (i < keys.length - 2 && seconds > keys[i + 1].seconds) i++;
    const a = keys[i];
    const b = keys[i + 1];
    const rate = (b.time - a.time) / (b.seconds - a.seconds);
    return a.time + (seconds - a.seconds) * rate;
  };
}

interface LegacyPath extends MapPath {
  start?: number; // seconds
  end?: number; // seconds
}

// Dates every version 1 march. Each is shown exactly as before: it starts and ends at the
// dates its bar's ends were at, and turns for the same share of the march.
export function convertLegacyPaths(
  paths: LegacyPath[],
  units: Unit[],
  keys: PacingKey[]
): MapPath[] {
  const clock = legacyClock(keys);

  return paths.map(({ start, end, ...path }) => {
    if (path.assignments.length === 0 || path.points.length < 2) return path;

    const playback = createPlayback(path, units);
    const startSeconds = Math.max(isNumber(start) ? start : 0, 0);
    const defaultEnd =
      startSeconds +
      Math.max(
        Math.round((playback.length / LEGACY_PACE) * 10) / 10,
        LEGACY_MIN_SECONDS
      );
    const endSeconds = Math.max(
      isNumber(end) ? end : defaultEnd,
      startSeconds + LEGACY_MIN_SECONDS
    );
    const share =
      playback.length > 0 ? playback.pivotLength / playback.length : 0;

    const from = clock(startSeconds);
    const turnEnd = clock(startSeconds + (endSeconds - startSeconds) * share);
    const to = clock(endSeconds);
    return {
      ...path,
      march: clampMarch({ start: from, end: to, turn: turnEnd - from }),
    };
  });
}

// ---- Reading a project file ----

function parseMarch(raw: unknown): MarchTiming | undefined {
  const m = raw as Partial<MarchTiming> | null | undefined;
  if (!m || !isNumber(m.start) || !isNumber(m.end)) return undefined;
  return clampMarch({
    start: m.start,
    end: m.end,
    turn: isNumber(m.turn) ? m.turn : 0,
  });
}

function parsePath(raw: any): LegacyPath {
  return {
    id: raw.id,
    name: raw.name,
    points: Array.isArray(raw.points) ? raw.points : [],
    assignments: Array.isArray(raw.assignments) ? raw.assignments : [],
    direction: isNumber(raw.direction) ? raw.direction : undefined,
    march: parseMarch(raw.march),
    start: isNumber(raw.start) ? raw.start : undefined,
    end: isNumber(raw.end) ? raw.end : undefined,
  };
}

function parseUnit(raw: any): Unit {
  const { appears, leaves, ...unit } = raw;
  return {
    ...unit,
    appears: isNumber(appears) ? appears : undefined,
    leaves: isNumber(leaves) ? leaves : undefined,
  };
}

function parseMarkers(raw: unknown): DateMarker[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m: DateMarker) =>
        m &&
        typeof m.id === "string" &&
        [m.time, m.year, m.month, m.day].every(isNumber)
    )
    .map((m: DateMarker) => ({
      id: m.id,
      time: Math.max(m.time, 0),
      ...clampDate(m),
    }));
}

function parsePacing(raw: unknown): PacingKey[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((k: PacingKey) => k && isNumber(k.seconds) && isNumber(k.time))
    .map((k: PacingKey) => ({ seconds: k.seconds, time: k.time }));
}

// Reads a project file as the app uses it. Version 1 files are converted: their marches are
// dated, the story starts at the date 0:00 had, and the date markers are kept as pacing.
export function parseProject(data: any): LoadedProject {
  if (!data || typeof data !== "object") return emptyProject();

  const rawViewport = data.viewport;
  const viewport: SavedViewport | null =
    rawViewport &&
    [rawViewport.centerX, rawViewport.centerY, rawViewport.scale].every(
      isNumber
    )
      ? {
          centerX: rawViewport.centerX,
          centerY: rawViewport.centerY,
          scale: rawViewport.scale,
        }
      : null;

  const units: Unit[] = Array.isArray(data.units)
    ? data.units.map(parseUnit)
    : [];
  const rawPaths: LegacyPath[] = Array.isArray(data.paths)
    ? data.paths.map(parsePath)
    : [];
  const selectedMapFilename = data.selectedMapFilename ?? null;

  if (isNumber(data.version) && data.version >= 2) {
    return {
      units,
      paths: rawPaths.map(({ start, end, ...path }) => path),
      storyStart: isNumber(data.storyStart)
        ? data.storyStart
        : DEFAULT_STORY_START,
      displayMode: DISPLAYS.includes(data.displayMode)
        ? data.displayMode
        : "months",
      pacing: parsePacing(data.pacing),
      selectedMapFilename,
      viewport,
    };
  }

  const pacing = pacingFromMarkers(parseMarkers(data.dateMarkers));
  return {
    units,
    paths: convertLegacyPaths(rawPaths, units, pacing),
    storyStart: legacyClock(pacing)(0),
    displayMode: data.dateMode === "days" ? "days" : "months",
    pacing,
    selectedMapFilename,
    viewport,
  };
}
