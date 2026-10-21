import React from "react";
import { VideoFrame } from "../../types";
import { FRAME_PIXELS, FrameRect } from "../../utils/video/camera";
import styles from "./FrameOverlay.module.css";

// The video frame drawn over the map: what's inside is what the video shows, and the map
// around it is dimmed. During a fade the inside goes dark too (0 clear, 1 black). It never
// gets in the way of the mouse. (The date in its corner is drawn by DateDisplay.)
function FrameOverlay({
  frame,
  shape,
  darkness = 0,
}: {
  frame: FrameRect;
  shape: VideoFrame;
  darkness?: number;
}) {
  const { width, height } = FRAME_PIXELS[shape];
  return (
    <div
      className={styles.frame}
      style={{
        left: frame.left,
        top: frame.top,
        width: frame.width,
        height: frame.height,
      }}
    >
      {darkness > 0 && (
        <div className={styles.black} style={{ opacity: darkness }} />
      )}
      <span className={styles.label}>
        {shape === "portrait" ? "9:16" : "16:9"} · {width}×{height}
      </span>
    </div>
  );
}

export default FrameOverlay;
