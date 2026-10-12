import React, { useState } from "react";
import { useTimelineStore } from "../../store/useTimelineStore";
import RenderDialog from "./RenderDialog";
import styles from "../timeline/Timeline.module.css";

// Opens the render dialog, in video mode
function RenderButton({ inVideo }: { inVideo: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {inVideo && (
        <button
          className={styles.textButton}
          onClick={() => {
            useTimelineStore.getState().pause();
            setOpen(true);
          }}
          title="Render the video to an MP4 in the project's exports folder"
        >
          Render video…
        </button>
      )}
      {open && <RenderDialog onClose={() => setOpen(false)} />}
    </>
  );
}

export default RenderButton;
