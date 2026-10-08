import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { formatHistoryTime, HistoryTime } from "../../utils/historyTime";
import { allowedStoryStart } from "../../utils/historyEdit";
import { MomentInput } from "./fields";
import styles from "./Timeline.module.css";

// When the story begins. It can't be later than the first march.
function StoryStartEditor({ firstMarch }: { firstMarch: HistoryTime | null }) {
  const storyStart = useMapStore((state) => state.storyStart);
  const setStoryStart = useMapStore((state) => state.setStoryStart);

  const commit = (wanted: HistoryTime) => {
    const next = allowedStoryStart(wanted, firstMarch);
    setStoryStart(next);
    // A playhead at or before the new start is at the start
    const timeline = useTimelineStore.getState();
    if (timeline.now !== null && timeline.now <= next) timeline.setNow(null);
  };

  return (
    <div className={styles.editor}>
      <MomentInput label="Story starts" value={storyStart} onCommit={commit} />
      <span className={styles.editorDim}>
        {firstMarch !== null
          ? `No later than the first march (${formatHistoryTime(firstMarch, "times")})`
          : "Select a march to edit its dates"}
      </span>
    </div>
  );
}

export default StoryStartEditor;
