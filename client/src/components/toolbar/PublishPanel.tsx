import React, { useState } from "react";
import ToolbarButton from "./ToolbarButton";
import RenderDialog from "../render/RenderDialog";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { formatSeconds, videoLength } from "../../utils/video/shots";
import styles from "./PathsPanel.module.css";

// Making the finished video. For now this is the render (the whole video or one shot, to an
// MP4 in the project's exports folder, with the earlier renders listed). Quick drafts, chapter
// renders, the YouTube pack and shorts join it in later weeks.
function PublishPanel() {
  const shots = useMapStore((state) => state.shots);
  const [rendering, setRendering] = useState(false);

  return (
    <div className={styles.panel}>
      <ToolbarButton
        icon="▶"
        label="Render video…"
        hint="Render the video to an MP4 in the project's exports folder"
        isExpanded={true}
        disabled={shots.length === 0}
        onClick={() => {
          useTimelineStore.getState().pause();
          setRendering(true);
        }}
      />
      <p className={styles.hint}>
        {shots.length === 0
          ? "Add shots in the Shots tab first: the video is made of them."
          : `${shots.length} shot${shots.length === 1 ? "" : "s"}, ${formatSeconds(videoLength(shots))} long. The render dialog also lists the videos made so far.`}
      </p>
      {rendering && <RenderDialog onClose={() => setRendering(false)} />}
    </div>
  );
}

export default PublishPanel;
