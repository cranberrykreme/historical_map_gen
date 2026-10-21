import { useEffect, useRef } from "react";
import { useCameraStore } from "../store/useCameraStore";
import { useMapStore } from "../store/useMapStore";
import { useTimelineStore } from "../store/useTimelineStore";
import { CameraView, MAP_SCENE } from "../types";
import { cameraAt, FrameRect } from "../utils/video/camera";
import { existingScene } from "../utils/scenes/scenes";
import { shotAt } from "../utils/video/shots";
import useSceneCameras from "./useSceneCameras";

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
//
// The editor follows the video between scenes: when the video reaches a shot of a battle, that
// battle opens, and a shot of the main map brings the main map back. While paused you can still
// open another scene to edit it; the next play or scrub takes you back to the video's.
function useVideoCamera(frame: FrameRect | null) {
  const cameras = useSceneCameras();
  const camerasRef = useRef(cameras);
  camerasRef.current = cameras;
  const inVideo = useTimelineStore((state) => state.mode === "video");
  const videoTime = useTimelineStore((state) => state.videoTime);
  const playing = useTimelineStore((state) => state.playing);
  const activeSceneId = useMapStore((state) => state.activeSceneId);

  // Open the scene the video is showing
  useEffect(() => {
    if (!inVideo) return;
    const state = useMapStore.getState();
    const place = shotAt(state.shots, videoTime);
    if (!place) return;
    const scene = existingScene(place.shot.scene ?? MAP_SCENE, state.battles);
    if (scene !== state.activeSceneId) state.switchScene(scene);
    // Only when the video moves, so a scene opened by hand while paused stays open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inVideo, videoTime, playing]);

  useEffect(() => {
    if (!inVideo || !frame) return;
    const api = useCameraStore.getState().api;
    if (!api) return;
    const { tracker, battles } = camerasRef.current;
    const state = useMapStore.getState();
    // Only move the camera for the scene on screen: a shot of another scene has nothing here
    const place = shotAt(state.shots, videoTime);
    const scene = existingScene(place?.shot.scene ?? MAP_SCENE, state.battles);
    if (scene !== activeSceneId) return;
    const view = cameraAt(
      state.shots,
      videoTime,
      openingView(),
      tracker,
      battles
    );
    if (view) api.show(view);
  }, [inVideo, videoTime, playing, frame, activeSceneId]);
}

export default useVideoCamera;
