import React from "react";
import ShotEditor from "../timeline/ShotEditor";
import { Shot } from "../../types";
import timelineStyles from "../timeline/Timeline.module.css";

// The selected shot: its name, chapter, scene and length; the history it shows; its camera
// and how the video cuts into it; deleting it
function ShotCard({ shot }: { shot: Shot }) {
  return (
    <div className={timelineStyles.inCard}>
      <ShotEditor shot={shot} />
    </div>
  );
}

export default ShotCard;
