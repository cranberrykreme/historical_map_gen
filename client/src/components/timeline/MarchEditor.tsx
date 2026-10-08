import React from "react";
import { useMapStore } from "../../store/useMapStore";
import { formatDuration } from "../../utils/historyTime";
import { MapPath, MarchTiming } from "../../types";
import { DurationInput, MomentInput } from "./fields";
import styles from "./Timeline.module.css";

// Exact dates for the selected march. Each change is one undo step.
function MarchEditor({ path, timing }: { path: MapPath; timing: MarchTiming }) {
  const setMarchTiming = useMapStore((state) => state.setMarchTiming);
  const marching = timing.end - timing.start - timing.turn;

  return (
    <div className={styles.editor}>
      <span className={styles.editorTitle} title={path.name}>
        {path.name}
      </span>
      <MomentInput
        label="Starts"
        value={timing.start}
        onCommit={(start) => setMarchTiming(path.id, { ...timing, start })}
      />
      <MomentInput
        label="Ends"
        value={timing.end}
        onCommit={(end) => setMarchTiming(path.id, { ...timing, end })}
      />
      <DurationInput
        label="Turning"
        value={timing.turn}
        onCommit={(turn) => setMarchTiming(path.id, { ...timing, turn })}
      />
      <span className={styles.editorDim}>
        Marching: {formatDuration(marching)}
      </span>
    </div>
  );
}

export default MarchEditor;
