import React, { useEffect, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { currentMoment, useTimelineStore } from "../../store/useTimelineStore";
import { Shot } from "../../types";
import { formatDuration } from "../../utils/historyTime";
import { isHeld, MIN_SHOT_SECONDS } from "../../utils/shots";
import { viewShowing } from "../../utils/timeline";
import { MomentInput, NumberField } from "./fields";
import styles from "./Timeline.module.css";

// The selected shot's name, length, stretch of history and options. Each change is one undo
// step.
function ShotEditor({ shot }: { shot: Shot }) {
  const updateShot = useMapStore((state) => state.updateShot);
  const deleteShot = useMapStore((state) => state.deleteShot);
  const storyStart = useMapStore((state) => state.storyStart);
  const now = useTimelineStore((state) => state.now);

  // The name is typed freely and saved when you leave the box or press Enter
  const [name, setName] = useState(shot.name);
  useEffect(() => setName(shot.name), [shot.name]);
  const commitName = () => {
    if (name.trim() && name !== shot.name) updateShot(shot.id, { name });
    else setName(shot.name);
  };

  const playhead = currentMoment(now, storyStart);

  // Zooms the history timeline to this shot's stretch
  const showOnTimeline = () => {
    const timeline = useTimelineStore.getState();
    const visible = timeline.view ?? { from: shot.from - 1, to: shot.to + 1 };
    timeline.setView(
      viewShowing({ start: shot.from, end: shot.to, turn: 0 }, visible)
    );
  };

  return (
    <div className={styles.editor}>
      <input
        className={styles.editorInput}
        style={{ width: 120 }}
        value={name}
        title="Shot name"
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setName(shot.name);
            e.currentTarget.blur();
          }
        }}
      />
      <span className={styles.field}>
        <span className={styles.editorLabel}>Length</span>
        <NumberField
          value={Math.round(shot.seconds * 10) / 10}
          min={MIN_SHOT_SECONDS}
          width={56}
          title="Seconds of video"
          onCommit={(seconds) => updateShot(shot.id, { seconds })}
        />
        <span className={styles.editorDim}>s</span>
      </span>
      <MomentInput
        label="From"
        value={shot.from}
        onCommit={(from) =>
          // Moving the start past the end holds that moment
          updateShot(shot.id, { from, to: Math.max(from, shot.to) })
        }
      />
      <MomentInput
        label="To"
        value={shot.to}
        onCommit={(to) =>
          updateShot(shot.id, { to, from: Math.min(to, shot.from) })
        }
      />
      <span className={styles.field}>
        <button
          className={styles.textButton}
          onClick={() =>
            updateShot(shot.id, {
              from: playhead,
              to: Math.max(playhead, shot.to),
            })
          }
          title="Start this shot at the playhead's moment"
        >
          From playhead
        </button>
        <button
          className={styles.textButton}
          onClick={() =>
            updateShot(shot.id, {
              to: playhead,
              from: Math.min(playhead, shot.from),
            })
          }
          title="End this shot at the playhead's moment"
        >
          To playhead
        </button>
        <button
          className={styles.textButton}
          onClick={() => updateShot(shot.id, { from: playhead, to: playhead })}
          title="Hold the playhead's moment for the whole shot, for a title or a pause"
        >
          Hold
        </button>
        <button
          className={styles.textButton}
          onClick={showOnTimeline}
          title="Zoom the timeline to this shot's stretch of history"
        >
          Show
        </button>
      </span>
      <label
        className={styles.editorCheck}
        title="History starts and ends slowly, like a march, instead of at a steady rate"
      >
        <input
          type="checkbox"
          checked={!!shot.ease}
          onChange={(e) => updateShot(shot.id, { ease: e.target.checked })}
        />
        Ease
      </label>
      <label
        className={styles.editorCheck}
        title="Hide the on-screen date while this shot is on screen"
      >
        <input
          type="checkbox"
          checked={!!shot.hideDate}
          onChange={(e) => updateShot(shot.id, { hideDate: e.target.checked })}
        />
        Hide date
      </label>
      <span className={styles.editorDim}>
        {isHeld(shot)
          ? "Holds one moment"
          : `Covers ${formatDuration(shot.to - shot.from)}`}
      </span>
      <button
        className={styles.textButton}
        onClick={() => deleteShot(shot.id)}
        title="Delete this shot"
      >
        Delete
      </button>
    </div>
  );
}

export default ShotEditor;
