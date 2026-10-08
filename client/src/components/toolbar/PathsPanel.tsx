import React, { useEffect, useState } from "react";
import ToolbarButton from "./ToolbarButton";
import { useMapStore } from "../../store/useMapStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { getTimeline } from "../../utils/timeline";
import SelectedUnitsSection from "./SelectedUnitsSection";
import PathList from "./PathList";
import AttachedUnitsSection from "./AttachedUnitsSection";
import styles from "./PathsPanel.module.css";

const PLAY_SPEED = 100; // map units per second at 1x

function PathsPanel() {
  const paths = useMapStore((state) => state.paths);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const renamePath = useMapStore((state) => state.renamePath);

  const drawingPoints = usePathToolStore((state) => state.drawingPoints);
  const startDrawing = usePathToolStore((state) => state.startDrawing);
  const finishDrawing = usePathToolStore((state) => state.finishDrawing);
  const cancelDrawing = usePathToolStore((state) => state.cancelDrawing);
  const playbackSpeed = usePathToolStore((state) => state.playbackSpeed);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const isDrawing = drawingPoints !== null;
  const pointCount = drawingPoints?.length ?? 0;

  const selectedPath = paths.find((path) => path.id === selectedPathId);

  // Switching paths, or leaving this panel, ends the preview: units go back to where they
  // really are. (A preview never changes the project.)
  useEffect(() => {
    setIsPlaying(false);
    return () => usePathToolStore.getState().clearPreview();
  }, [selectedPathId]);

  // Play: advance the preview at a steady speed until the end of the path.
  // Changing the speed restarts this from wherever the preview has got to.
  useEffect(() => {
    if (!isPlaying || !selectedPathId) return;
    const { paths: allPaths, placedUnits: allUnits } = useMapStore.getState();
    const path = allPaths.find((p) => p.id === selectedPathId);
    // The whole run: the pivot on the spot at the start, then the journey along the path
    const length =
      getTimeline(allPaths, allUnits).playbacks.get(selectedPathId)?.length ??
      0;
    if (!path || length === 0) {
      setIsPlaying(false);
      return;
    }

    const current = usePathToolStore.getState().preview;
    let position =
      current && current.pathId === selectedPathId && current.progress < 1
        ? current.progress
        : 0;
    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      // Cap the step so a background tab resuming doesn't make the units leap
      const elapsed = Math.min(Math.max((now - last) / 1000, 0), 0.1);
      last = now;
      position = Math.min(
        position + (elapsed * PLAY_SPEED * playbackSpeed) / length,
        1
      );
      usePathToolStore.getState().setPreview(selectedPathId, position);
      if (position >= 1) {
        setIsPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, selectedPathId, playbackSpeed]);

  const startRename = (id: string, currentName: string) => {
    setRenameValue(currentName);
    setRenamingId(id);
  };

  const commitRename = () => {
    if (renamingId === null) return;
    const id = renamingId;
    const current = paths.find((path) => path.id === id);
    const trimmed = renameValue.trim();
    setRenamingId(null);
    if (trimmed && current && trimmed !== current.name) {
      renamePath(id, trimmed);
    }
  };

  return (
    <div className={styles.panel}>
      <ToolbarButton
        icon="+"
        label="New path"
        isExpanded={true}
        isActive={isDrawing}
        onClick={() => {
          if (!isDrawing) startDrawing();
        }}
      />

      {isDrawing ? (
        <div className={styles.drawing}>
          <p className={styles.hint}>
            Move to the map and click to place waypoints. {pointCount} placed so
            far.
          </p>
          <div className={styles.actions}>
            <button
              className={styles.finishButton}
              onClick={finishDrawing}
              disabled={pointCount < 2}
            >
              Finish
            </button>
            <button className={styles.cancelButton} onClick={cancelDrawing}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          <SelectedUnitsSection onStopPreview={() => setIsPlaying(false)} />

          <PathList
            rename={{
              renamingId,
              renameValue,
              setRenameValue,
              startRename,
              commitRename,
              cancelRename: () => setRenamingId(null),
            }}
          />

          {selectedPath && (
            <AttachedUnitsSection
              selectedPath={selectedPath}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default PathsPanel;
