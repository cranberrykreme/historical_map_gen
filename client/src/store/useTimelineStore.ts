import { create } from "zustand";
import { MarchTiming } from "../types";
import { HistoryTime } from "../utils/history/historyTime";
import { HistoryView } from "../utils/history/timeline";
import { StripView } from "../utils/history/stripView";
import { SHOW_FILTERS, ShowFilter } from "../utils/history/timelineRows";

// The rows area's height, in pixels: the ruler and about seven rows to begin with
export const DEFAULT_ROWS_HEIGHT = 228;
export const MIN_ROWS_HEIGHT = 80;
const MAX_ROWS_SHARE = 0.7; // of the window's height

// Between the smallest useful height and most of the window
export const clampRowsHeight = (height: number, windowHeight: number): number =>
  Math.round(
    Math.min(
      Math.max(height, MIN_ROWS_HEIGHT),
      Math.max(MIN_ROWS_HEIGHT, windowHeight * MAX_ROWS_SHARE)
    )
  );

// Tall: most of the window, for working on the rows. Double-clicking the timeline's top edge
// switches between this and the usual height.
export const tallRowsHeight = (windowHeight: number): number =>
  clampRowsHeight(windowHeight * MAX_ROWS_SHARE, windowHeight);

export function toggledRowsHeight(
  current: number,
  windowHeight: number
): number {
  const tall = tallRowsHeight(windowHeight);
  const usual = clampRowsHeight(DEFAULT_ROWS_HEIGHT, windowHeight);
  // Anything closer to tall than to the usual height counts as tall
  return Math.abs(current - tall) < Math.abs(current - usual) ? usual : tall;
}

// The row filter and the height are remembered in this browser. Storage can be missing or
// refuse (private windows, blocked site data), so every read and write is guarded.
const FILTER_KEY = "historyMap.timeline.show";
const HEIGHT_KEY = "historyMap.timeline.rowsHeight";

function remembered(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function remember(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Not remembered; it still applies until the page is reloaded
  }
}

function rememberedFilter(): ShowFilter {
  const saved = remembered(FILTER_KEY);
  return SHOW_FILTERS.includes(saved as ShowFilter)
    ? (saved as ShowFilter)
    : "everything";
}

function rememberedHeight(): number {
  const saved = Number(remembered(HEIGHT_KEY));
  return Number.isFinite(saved) && saved >= MIN_ROWS_HEIGHT
    ? saved
    : DEFAULT_ROWS_HEIGHT;
}

// Video mode's lanes under the shots, waiting for what later weeks put on them. Each folds
// away to a thin line, and starts folded while it's empty.
export const VIDEO_LANES: { key: string; label: string; week: string }[] = [
  { key: "overlays", label: "Overlays", week: "10.5" },
  { key: "narration", label: "Narration", week: "10" },
  { key: "music", label: "Music", week: "10" },
  { key: "effects", label: "Sound effects", week: "10" },
];

// What the playhead follows: history directly, or the video, whose shots say which moment
// of history is on screen
export type TimelineMode = "history" | "video";

interface DraftTiming {
  pathId: string;
  timing: MarchTiming;
}

// The playhead and the timeline bar's own state. It is not part of the document: the saved
// parts (each march's dates and the story's start) live in the map store.
interface TimelineStore {
  now: HistoryTime | null; // the playhead, a moment in history; null means the story's start
  playing: boolean;
  pace: number; // days of history played per second
  expanded: boolean;
  draftTiming: DraftTiming | null; // a bar being dragged, shown before it is saved
  view: HistoryView | null; // the stretch of history the bar shows; null fits the whole story
  rowFilter: ShowFilter; // what the rows show
  collapsedGroups: string[]; // the army groups folded away (keys from utils/history/timelineRows)
  rowsHeight: number; // the rows area's height in pixels; drag the timeline's top edge
  mode: TimelineMode;
  videoTime: number; // the video playhead, in seconds; in video mode it sets `now`
  // How far down the window the timeline's top edge is, in pixels, so the video frame can
  // sit above it. Null until the timeline has been measured.
  timelineTop: number | null;
  // The stretch of the video the video strip shows; null shows the whole video
  stripView: StripView | null;
  // The shot opened up in Video mode, showing its own rows in its own seconds
  openShotId: string | null;
  // Video mode's extra lanes folded away to a thin line (see VIDEO_LANES)
  foldedLanes: string[];

  setNow: (now: HistoryTime | null) => void;
  play: () => void;
  pause: () => void;
  setPace: (pace: number) => void;
  setExpanded: (expanded: boolean) => void;
  setDraftTiming: (draft: DraftTiming | null) => void;
  setView: (view: HistoryView | null) => void;
  setRowFilter: (filter: ShowFilter) => void;
  toggleGroup: (key: string) => void;
  expandGroup: (key: string) => void;
  setRowsHeight: (height: number) => void; // while dragging; not remembered yet
  saveRowsHeight: () => void; // when the drag ends
  setMode: (mode: TimelineMode) => void;
  setVideoTime: (seconds: number) => void;
  setTimelineTop: (top: number | null) => void;
  setStripView: (view: StripView | null) => void;
  setOpenShot: (id: string | null) => void;
  toggleLane: (key: string) => void;
  reset: () => void; // for a newly opened project: keeps the filter, the height and where the timeline is
}

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  now: null,
  playing: false,
  pace: 1,
  expanded: true,
  draftTiming: null,
  view: null,
  rowFilter: rememberedFilter(),
  collapsedGroups: [],
  rowsHeight: rememberedHeight(),
  mode: "history",
  videoTime: 0,
  timelineTop: null,
  stripView: null,
  openShotId: null,
  foldedLanes: VIDEO_LANES.map((lane) => lane.key),

  setNow: (now) => set({ now }),
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  setPace: (pace) => set({ pace }),
  setExpanded: (expanded) => set({ expanded }),
  setDraftTiming: (draftTiming) => set({ draftTiming }),
  setView: (view) => set({ view }),
  setRowFilter: (rowFilter) => {
    set({ rowFilter });
    remember(FILTER_KEY, rowFilter);
  },
  toggleGroup: (key) => {
    const collapsed = get().collapsedGroups;
    set({
      collapsedGroups: collapsed.includes(key)
        ? collapsed.filter((k) => k !== key)
        : [...collapsed, key],
    });
  },
  expandGroup: (key) => {
    const collapsed = get().collapsedGroups;
    if (collapsed.includes(key))
      set({ collapsedGroups: collapsed.filter((k) => k !== key) });
  },
  setRowsHeight: (rowsHeight) => set({ rowsHeight }),
  saveRowsHeight: () => remember(HEIGHT_KEY, String(get().rowsHeight)),
  // Switching what the playhead follows stops playback
  setMode: (mode) => {
    if (mode !== get().mode) set({ mode, playing: false });
  },
  setVideoTime: (seconds) => set({ videoTime: Math.max(seconds, 0) }),
  setTimelineTop: (timelineTop) => {
    if (timelineTop !== get().timelineTop) set({ timelineTop });
  },
  setStripView: (stripView) => set({ stripView }),
  setOpenShot: (openShotId) => set({ openShotId }),
  toggleLane: (key) => {
    const folded = get().foldedLanes;
    set({
      foldedLanes: folded.includes(key)
        ? folded.filter((k) => k !== key)
        : [...folded, key],
    });
  },
  reset: () =>
    set({
      stripView: null,
      openShotId: null,
      now: null,
      playing: false,
      draftTiming: null,
      view: null,
      collapsedGroups: [],
      mode: "history",
      videoTime: 0,
    }),
}));

// The moment the playhead is at
export const currentMoment = (
  now: HistoryTime | null,
  storyStart: HistoryTime
): HistoryTime => now ?? storyStart;

// Whether the playhead is past the story's start. Placed units can only be edited at the
// start, because anywhere later they are shown where their marches have taken them.
export const isPastStart = (
  now: HistoryTime | null,
  storyStart: HistoryTime
): boolean => now !== null && now > storyStart;
