import { useEffect } from "react";
import { currentMoment, useTimelineStore } from "../../store/useTimelineStore";
import { HistoryTime } from "../../utils/historyTime";

// Play: move through history at the chosen pace until the last march has finished
export function usePlayback(
  playing: boolean,
  storyStart: HistoryTime,
  storyEnd: HistoryTime | null,
  pause: () => void
) {
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
}
