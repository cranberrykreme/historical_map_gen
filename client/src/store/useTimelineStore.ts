import { create } from "zustand";
import { MovementTiming } from "../utils/timeline";

interface DraftTiming {
  pathId: string;
  timing: MovementTiming;
}

// The playhead and the timeline bar's own state. It is not part of the document: the saved
// parts (each movement's start and end, and the date markers) live in the map store.
interface TimelineStore {
  time: number; // playhead position, in seconds
  playing: boolean;
  speed: number; // 1 = real time
  expanded: boolean;
  draftTiming: DraftTiming | null; // a bar being dragged, shown before it is saved
  selectedMarkerId: string | null;

  setTime: (time: number) => void;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  setExpanded: (expanded: boolean) => void;
  setDraftTiming: (draft: DraftTiming | null) => void;
  selectMarker: (id: string | null) => void;
  reset: () => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  time: 0,
  playing: false,
  speed: 1,
  expanded: true,
  draftTiming: null,
  selectedMarkerId: null,

  setTime: (time) => set({ time: Math.max(time, 0) }),
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  setSpeed: (speed) => set({ speed }),
  setExpanded: (expanded) => set({ expanded }),
  setDraftTiming: (draftTiming) => set({ draftTiming }),
  selectMarker: (selectedMarkerId) => set({ selectedMarkerId }),
  reset: () =>
    set({ time: 0, playing: false, draftTiming: null, selectedMarkerId: null }),
}));
