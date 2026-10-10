import { useEffect } from "react";
import {
  currentMoment,
  TimelineMode,
  useTimelineStore,
} from "../../store/useTimelineStore";
import { useMapStore } from "../../store/useMapStore";
import { HistoryTime } from "../../utils/historyTime";
import { videoMoment } from "../../utils/shots";

// Play. In history mode the playhead moves through history at the chosen pace until the
// last march has finished. In video mode the video plays in real time, one second a second,
// through the shots in order until the end, and the history playhead follows it.
export function usePlayback(
  playing: boolean,
  storyStart: HistoryTime,
  storyEnd: HistoryTime | null,
  pause: () => void,
  mode: TimelineMode,
  videoEnd: number
) {
  useEffect(() => {
    if (!playing) return;
    const nothingToPlay =
      mode === "video"
        ? videoEnd <= 0
        : storyEnd === null || storyEnd <= storyStart;
    if (nothingToPlay) {
      pause();
      return;
    }
    let last = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const elapsed = Math.min(Math.max((time - last) / 1000, 0), 0.1);
      last = time;
      const state = useTimelineStore.getState();

      if (mode === "video") {
        const next = Math.min(state.videoTime + elapsed, videoEnd);
        state.setVideoTime(next);
        state.setNow(
          videoMoment(useMapStore.getState().shots, next, storyStart)
        );
        if (next >= videoEnd) {
          state.pause();
          return;
        }
        frame = requestAnimationFrame(tick);
        return;
      }

      const next = currentMoment(state.now, storyStart) + elapsed * state.pace;
      if (storyEnd !== null && next >= storyEnd) {
        state.setNow(storyEnd);
        state.pause();
        return;
      }
      state.setNow(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, storyStart, storyEnd, pause, mode, videoEnd]);
}
