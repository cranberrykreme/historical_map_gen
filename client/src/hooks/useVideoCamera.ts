import { useEffect, useRef } from "react";
import { useCameraStore } from "../store/useCameraStore";
import { useMapStore } from "../store/useMapStore";
import { useTimelineStore } from "../store/useTimelineStore";
import { CameraView } from "../types";
import { cameraAt, FrameRect } from "../utils/camera";
import useArmyTracker from "./useArmyTracker";

// The project's saved view as the camera sees it, which is where the video opens until a shot
// sets its own view. Null when the project has no saved view yet.
export function openingView(): CameraView | null {
  const saved = useMapStore.getState().savedViewport;
  const api = useCameraStore.getState().api;
  return saved && api ? api.fromSaved(saved) : null;
}

// In video mode the camera moves the map: as the video plays, when you scrub, when you press
// Play, and when the frame changes size. While paused you can pan and zoom freely to look
// around; the next play or scrub puts the camera back. Shots that follow an army track it.
// Editing while paused (placing a unit, finishing a path, selecting) leaves the camera where
// you've moved it: the army tracker those edits rebuild is read when the camera next moves,
// rather than moving the camera itself.
function useVideoCamera(frame: FrameRect | null) {
  const tracker = useArmyTracker();
  const trackerRef = useRef(tracker);
  trackerRef.current = tracker;
  const inVideo = useTimelineStore((state) => state.mode === "video");
  const videoTime = useTimelineStore((state) => state.videoTime);
  const playing = useTimelineStore((state) => state.playing);

  useEffect(() => {
    if (!inVideo || !frame) return;
    const api = useCameraStore.getState().api;
    if (!api) return;
    const view = cameraAt(
      useMapStore.getState().shots,
      videoTime,
      openingView(),
      trackerRef.current
    );
    if (view) api.show(view);
  }, [inVideo, videoTime, playing, frame]);
}

export default useVideoCamera;
