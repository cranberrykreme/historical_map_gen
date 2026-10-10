import { useEffect } from "react";
import { TimelineMode, useTimelineStore } from "../../store/useTimelineStore";
import { Shot } from "../../types";
import { HistoryTime } from "../../utils/historyTime";
import { videoMoment } from "../../utils/shots";

// In video mode the history playhead shows whatever the video is showing: it follows the
// video playhead as it is scrubbed, and follows the shots as they are edited
export function useVideoClock(
  mode: TimelineMode,
  videoTime: number,
  shots: Shot[],
  storyStart: HistoryTime
) {
  useEffect(() => {
    if (mode !== "video") return;
    const state = useTimelineStore.getState();
    const now = videoMoment(shots, videoTime, storyStart);
    if (state.now !== now) state.setNow(now);
  }, [mode, videoTime, shots, storyStart]);
}
