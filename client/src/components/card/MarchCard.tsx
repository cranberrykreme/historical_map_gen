import React, { useMemo } from "react";
import CollapsibleSection from "../toolbar/CollapsibleSection";
import AttachedUnitsSection from "../toolbar/AttachedUnitsSection";
import MarchEditor from "../timeline/MarchEditor";
import CommitText from "./CommitText";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { getTimeline } from "../../utils/history/timeline";
import { MapPath } from "../../types";
import usePathPreview from "../../hooks/usePathPreview";
import timelineStyles from "../timeline/Timeline.module.css";
import styles from "../toolbar/PathsPanel.module.css";

const ROW: React.CSSProperties = { display: "flex", gap: 6 };

// The selected march: its name, when it starts and ends, how long it turns first, the units
// it carries (with the formation and the preview), and deleting it
function MarchCard({ path }: { path: MapPath }) {
  const paths = useMapStore((state) => state.paths);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const renamePath = useMapStore((state) => state.renamePath);
  const deletePath = useMapStore((state) => state.deletePath);
  const { isPlaying, setIsPlaying } = usePathPreview(path.id);

  const timing = useMemo(
    () => getTimeline(paths, placedUnits).timings.get(path.id),
    [paths, placedUnits, path.id]
  );

  // Clicking a date moves the playhead there
  const goTo = (moment: number) => {
    usePathToolStore.getState().clearPreview();
    const timeline = useTimelineStore.getState();
    timeline.pause();
    timeline.setMode("history");
    timeline.setNow(moment);
  };

  return (
    <>
      <CollapsibleSection id="card-march" title="March">
        <label className={styles.hint} style={ROW}>
          <CommitText
            value={path.name}
            title="The march's name"
            onCommit={(name) => name.trim() && renamePath(path.id, name.trim())}
          />
        </label>
        {timing ? (
          <>
            <div className={timelineStyles.inCard}>
              <MarchEditor path={path} timing={timing} />
            </div>
            <div style={ROW}>
              <button
                className={styles.cancelButton}
                onClick={() => goTo(timing.start)}
                title="Move the playhead to when this march sets off"
              >
                Go to start
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => goTo(timing.end)}
                title="Move the playhead to when this march ends"
              >
                Go to end
              </button>
            </div>
          </>
        ) : (
          <p className={styles.hint}>
            Put units on this march to give it dates.
          </p>
        )}
      </CollapsibleSection>
      <AttachedUnitsSection
        selectedPath={path}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />
      <button
        className={styles.cancelButton}
        onClick={() => deletePath(path.id)}
        title="Delete this march (⌘Z brings it back)"
      >
        Delete march
      </button>
    </>
  );
}

export default MarchCard;
