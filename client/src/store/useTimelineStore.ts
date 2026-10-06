import { create } from "zustand";
import { MarchTiming } from "../types";
import { HistoryTime } from "../utils/historyTime";
import { HistoryView } from "../utils/timeline";

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

  setNow: (now: HistoryTime | null) => void;
  play: () => void;
  pause: () => void;
  setPace: (pace: number) => void;
  setExpanded: (expanded: boolean) => void;
  setDraftTiming: (draft: DraftTiming | null) => void;
  setView: (view: HistoryView | null) => void;
  reset: () => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  now: null,
  playing: false,
  pace: 1,
  expanded: true,
  draftTiming: null,
  view: null,

  setNow: (now) => set({ now }),
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  setPace: (pace) => set({ pace }),
  setExpanded: (expanded) => set({ expanded }),
  setDraftTiming: (draftTiming) => set({ draftTiming }),
  setView: (view) => set({ view }),
  reset: () =>
    set({ now: null, playing: false, draftTiming: null, view: null }),
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
