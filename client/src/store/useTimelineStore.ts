import { create } from "zustand";
import { MarchTiming } from "../types";
import { HistoryTime } from "../utils/historyTime";
import { HistoryView } from "../utils/timeline";
import { ROW_FILTERS, RowFilter } from "../utils/timelineRows";

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

// The row filter and the height are remembered in this browser. Storage can be missing or
// refuse (private windows, blocked site data), so every read and write is guarded.
const FILTER_KEY = "historyMap.timeline.rowFilter";
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

function rememberedFilter(): RowFilter {
  const saved = remembered(FILTER_KEY);
  return ROW_FILTERS.includes(saved as RowFilter)
    ? (saved as RowFilter)
    : "all";
}

function rememberedHeight(): number {
  const saved = Number(remembered(HEIGHT_KEY));
  return Number.isFinite(saved) && saved >= MIN_ROWS_HEIGHT
    ? saved
    : DEFAULT_ROWS_HEIGHT;
}

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
  rowFilter: RowFilter; // which marches are listed
  collapsedGroups: string[]; // the army groups folded away (keys from utils/timelineRows)
  rowsHeight: number; // the rows area's height in pixels; drag the timeline's top edge

  setNow: (now: HistoryTime | null) => void;
  play: () => void;
  pause: () => void;
  setPace: (pace: number) => void;
  setExpanded: (expanded: boolean) => void;
  setDraftTiming: (draft: DraftTiming | null) => void;
  setView: (view: HistoryView | null) => void;
  setRowFilter: (filter: RowFilter) => void;
  toggleGroup: (key: string) => void;
  expandGroup: (key: string) => void;
  setRowsHeight: (height: number) => void; // while dragging; not remembered yet
  saveRowsHeight: () => void; // when the drag ends
  reset: () => void; // for a newly opened project: keeps the filter and the height
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
  reset: () =>
    set({
      now: null,
      playing: false,
      draftTiming: null,
      view: null,
      collapsedGroups: [],
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
