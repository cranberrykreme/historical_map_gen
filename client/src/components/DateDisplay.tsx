import React from "react";
import { useMapStore } from "../store/useMapStore";
import { currentMoment, useTimelineStore } from "../store/useTimelineStore";
import { useCameraStore } from "../store/useCameraStore";
import { formatHistoryTime } from "../utils/historyTime";
import { dateHiddenAt } from "../utils/shots";
import { FRAME_PIXELS, videoDarkness } from "../utils/camera";
import styles from "./DateDisplay.module.css";

// The date: the moment in history the playhead is at. In history mode it sits in the corner
// of the screen. In video mode it sits in the video frame's top left corner instead, drawn at
// the frame's scale so it lands exactly where the render puts it, and fades with the picture.
// While the video plays, a shot can hide it (for a title card, say).
function DateDisplay() {
  const storyStart = useMapStore((state) => state.storyStart);
  const displayMode = useMapStore((state) => state.displayMode);
  const shots = useMapStore((state) => state.shots);
  const videoFrame = useMapStore((state) => state.videoFrame);
  const now = useTimelineStore((state) => state.now);
  const inVideo = useTimelineStore((state) => state.mode === "video");
  const videoTime = useTimelineStore((state) => state.videoTime);
  const frame = useCameraStore((state) => state.frameOnScreen);

  if (inVideo && dateHiddenAt(shots, videoTime)) return null;

  const text = formatHistoryTime(currentMoment(now, storyStart), displayMode);

  if (!inVideo) return <div className={styles.date}>{text}</div>;
  if (!frame) return null;

  // Laid out at the video's own pixel size, then shrunk to the frame on screen. A fade darkens
  // it by the same amount as the picture behind it.
  const scale = frame.width / FRAME_PIXELS[videoFrame].width;
  const darkness = Math.min(videoDarkness(shots, videoTime), 1);
  return (
    <div
      className={styles.frameLayer}
      style={{
        left: frame.left,
        top: frame.top,
        transform: `scale(${scale})`,
        filter: darkness > 0 ? `brightness(${1 - darkness})` : undefined,
      }}
    >
      <div className={`${styles.date} ${styles.inFrame}`}>{text}</div>
    </div>
  );
}

export default DateDisplay;
